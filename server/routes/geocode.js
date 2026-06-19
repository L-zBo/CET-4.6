// ========== /api/geocode/* —— 高德地图 Web 服务代理 ==========
// 目的：把高德 API key 留在后端，前端只调本地 /api/geocode/...，key 永不出浏览器。
// 文件读取顺序：环境变量 AMAP_KEY > server/.amap_key.local 文件。
// 若两处都没有，所有路由直接返回 503，前端会回退到 OSM/Photon 等免 key 源。
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ---- 加载 key（启动一次性读，避免每次 IO）----
function loadAmapKey() {
  if (process.env.AMAP_KEY) return process.env.AMAP_KEY.trim();
  const keyFile = path.join(__dirname, '..', '.amap_key.local');
  try {
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, 'utf8').trim();
    }
  } catch (_) {}
  return '';
}
const AMAP_KEY = loadAmapKey();

// 启动日志：只打是否就绪，绝不打 key 本身（防 key 被日志收集吐到屏幕）
if (AMAP_KEY) {
  console.log('  [geocode] 高德代理就绪 (key 已加载，长度=' + AMAP_KEY.length + ')');
} else {
  console.log('  [geocode] 未配置高德 key，相关路由将返回 503');
}

// ---- 速率限制：按 IP 每分钟 30 次，防止被人当免费代理用 ----
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;
const rateMap = new Map();   // ip -> { count, resetAt }
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = rateMap.get(ip);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateMap.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > RATE_MAX) {
    return res.status(429).json({ error: '请求过快，请稍后' });
  }
  next();
}

// ---- 工具：检查 key 在不在；不在直接 503 ----
function requireKey(_req, res, next) {
  if (!AMAP_KEY) {
    return res.status(503).json({ error: '高德服务未配置' });
  }
  next();
}

// ---- 工具：调高德 + 错误清洗（不让原始错误带 key 反弹到前端日志）----
async function amapGet(url) {
  // 给高德加默认 UA，部分接口对空 UA 不友好
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'ACE-The-CET/1.0 (+server proxy)' }
  });
  if (!resp.ok) throw new Error('amap HTTP ' + resp.status);
  const data = await resp.json();
  // 高德返回的 status=1 表示成功
  if (data.status !== '1') {
    throw new Error('amap status=' + data.status + ' info=' + (data.info || '?'));
  }
  return data;
}

// ---- 路由 1：逆地理（lat,lon → 详细地址）----
// 客户端传 lat,lon（WGS-84，浏览器 geolocation 标准），后端转换字段顺序为高德的 lon,lat
// 高德返回粒度可到"街道+门牌号"，比 OSM/Photon 强
router.get('/reverse', rateLimit, requireKey, async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (!isFinite(lat) || !isFinite(lon)) {
    return res.status(400).json({ error: '缺少或无效的 lat/lon' });
  }
  try {
    // 注意 1：高德是 location=lon,lat（经度在前），跟 OSM 相反
    // 注意 2：extensions=base 已含 addressComponent.streetNumber，够用且省 quota
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}`
              + `&location=${lon.toFixed(6)},${lat.toFixed(6)}`
              + `&extensions=base&radius=200&roadlevel=0`;
    const data = await amapGet(url);
    const r = data.regeocode || {};
    const ac = r.addressComponent || {};
    const sn = ac.streetNumber || {};
    // 高德对没值的字段会返回空数组 []，必须先确保是字符串
    const strOrEmpty = v => (typeof v === 'string' ? v : '');
    const district = strOrEmpty(ac.district);
    let street = strOrEmpty(sn.street) || strOrEmpty(ac.township) || '';
    const number = strOrEmpty(sn.number);
    const formatted = strOrEmpty(r.formatted_address);
    // 街道仍为空时，从 formatted_address 里提取（高德往往把"XX街道"放在 formatted 末尾）
    // 例："湖北省武汉市东西湖区东山街道" → 截取末尾的"东山街道"
    if (!street && formatted) {
      const m = formatted.match(/([一-龥]+?(?:街道|镇|乡))$/);
      if (m) street = m[1];
    }
    // 拼接：东西湖区 + 街道 + 门牌
    let label = '';
    if (district && street) label = `${district} ${street}${number}`;
    else if (district) label = district;
    else if (street) label = `${street}${number}`;
    else label = formatted;
    res.json({
      label,
      formatted_address: formatted,
      district, street, number,
      adcode: strOrEmpty(ac.adcode),   // 高德行政区编码，给 weather API 用
      source: 'amap'
    });
  } catch (err) {
    // 注意：err.message 不会包含 key（高德响应里没有），但稳妥起见不把原始 err 透传
    console.warn('  [geocode] /reverse 失败:', err.message);
    res.status(502).json({ error: '反查失败', detail: err.message });
  }
});

// ---- 路由 2：输入提示（自动联想）----
// 给手动输入框用：输入"马池"实时返回候选列表
router.get('/tips', rateLimit, requireKey, async (req, res) => {
  const q = (req.query.q || '').trim();
  const city = (req.query.city || '').trim();
  // location 是高德按"lon,lat"格式接收的坐标，传了它结果按距离排序
  const location = (req.query.location || '').trim();
  if (!q) return res.json({ tips: [] });
  if (q.length > 32) return res.status(400).json({ error: 'q 过长' });
  // 防注入：location 只允许数字 + 逗号 + 小数点
  const safeLocation = /^[\d.,-]+$/.test(location) ? location : '';
  try {
    const url = `https://restapi.amap.com/v3/assistant/inputtips?key=${AMAP_KEY}`
              + `&keywords=${encodeURIComponent(q)}`
              + (city ? `&city=${encodeURIComponent(city)}` : '')
              + (safeLocation ? `&location=${encodeURIComponent(safeLocation)}` : '')
              + `&datatype=poi`;
    const data = await amapGet(url);
    // 清洗：只暴露前端用得上的字段，绝不透传任何 server 字段
    // 高德对空字段会返回 []，转字符串前必须先 typeof 判定
    const strOrEmpty = v => (typeof v === 'string' ? v : '');
    const tips = (data.tips || []).map(t => ({
      name: strOrEmpty(t.name),
      district: strOrEmpty(t.district),
      address: strOrEmpty(t.address),
      location: strOrEmpty(t.location)
    })).filter(t => t.name);
    res.json({ tips: tips.slice(0, 10) });
  } catch (err) {
    console.warn('  [geocode] /tips 失败:', err.message);
    res.status(502).json({ error: '联想失败', detail: err.message });
  }
});

// ---- 路由 3：高德实况天气（按 adcode 查）----
// 比 Open-Meteo 在国内更准，返回中文天气描述（多云/晴/小雨/雷阵雨等）
// 前端拉到 reverse 的 adcode 后再调本路由，拿到的天气直接显示
router.get('/weather', rateLimit, requireKey, async (req, res) => {
  const adcode = (req.query.adcode || '').trim();
  if (!/^\d{6}$/.test(adcode)) {
    return res.status(400).json({ error: 'adcode 必须是 6 位数字' });
  }
  try {
    const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}`
              + `&city=${adcode}&extensions=base`;
    const data = await amapGet(url);
    const live = (data.lives && data.lives[0]) || null;
    if (!live) return res.status(502).json({ error: '无实况天气数据' });
    res.json({
      weather: live.weather || '',          // 中文：多云/晴/小雨...
      temperature: parseInt(live.temperature, 10),
      winddirection: live.winddirection || '',
      windpower: live.windpower || '',
      humidity: parseInt(live.humidity, 10),
      reporttime: live.reporttime || '',
      city: live.city || '',
      source: 'amap'
    });
  } catch (err) {
    console.warn('  [geocode] /weather 失败:', err.message);
    res.status(502).json({ error: '天气查询失败', detail: err.message });
  }
});

module.exports = router;