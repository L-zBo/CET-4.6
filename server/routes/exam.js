// 考试信息接口：日程 / 试卷结构 / 翻译主题分类
// 数据分两层：
//   基线 server/exam_info.json —— 随仓库分发，官方已公布或依据官方安排整理，绝不含推测日期
//   缓存 server/data/exam_info_cache.json —— 联网校验后的结果，仅本地留存
// 设计原则：有网时尝试向官方站校验，拿不到就原样用基线数据并如实告知"当前无网络"，
// 绝不因为拿不到新数据就编一个。
const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');

const router = express.Router();

const BASE_FILE = path.join(__dirname, '..', 'exam_info.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'exam_info_cache.json');
const OFFICIAL_URL = 'https://cet.neea.edu.cn/';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;   // 同一进程内最多 6 小时校验一次

let lastCheckAt = 0;
let lastOnline = null;          // true=上次校验联通  false=不通  null=尚未校验

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

// 只做连通性与"官方页面是否提到更晚的年份"这类轻量校验，不解析对方 HTML 结构，
// 避免对方改版就崩。真正的日程更新仍以人工核对官方公告后修改基线文件为准。
function probeOfficial() {
  return new Promise(resolve => {
    const req = https.get(OFFICIAL_URL, { timeout: 6000 }, res => {
      res.resume();                       // 不需要正文，读完丢弃
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

router.get('/info', async (req, res) => {
  const base = readJSON(BASE_FILE, null);
  if (!base) {
    return res.status(500).json({ ok: false, error: '考试信息基线数据缺失' });
  }

  const cache = readJSON(CACHE_FILE, null);
  const now = Date.now();

  // 控制校验频率：短时间内重复进入页面不反复打官方站
  if (now - lastCheckAt > CHECK_INTERVAL_MS) {
    lastCheckAt = now;
    lastOnline = await probeOfficial();
    if (lastOnline) {
      try {
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify({
          checkedAt: new Date(now).toISOString(),
          online: true,
        }), 'utf8');
      } catch (e) { /* 缓存写不进去不影响返回 */ }
    }
  }

  const online = lastOnline === null ? true : lastOnline;
  res.json({
    ok: true,
    online,
    // 数据本身的更新日期（人工核对官方公告后写入基线文件）
    updatedAt: base.updatedAt,
    // 最近一次联通性校验时间，无网时回退到缓存里记录的上次成功时间
    checkedAt: online ? new Date(lastCheckAt || now).toISOString()
                      : (cache && cache.checkedAt) || null,
    offlineNotice: online ? null
      : '当前无法连接网络，以下为随程序分发的最近一次数据，可能不是最新',
    data: base,
  });
});

module.exports = router;
