// ========== ACE-The-CET Express 服务入口 ==========
const express = require('express');
const path = require('path');
const config = require('./config');
const { dbReady } = require('./db');

const app = express();

// 中间件
app.use(express.json({ limit: '2mb' }));

// 安全：拦截对敏感目录的访问
const BLOCKED_PATHS = ['/server', '/node_modules', '/node', '/.git', '/.playwright-mcp', '/.spec-workflow', '/reference', '/package.json', '/package-lock.json'];
app.use((req, res, next) => {
  const lower = req.path.toLowerCase();
  if (BLOCKED_PATHS.some(p => lower === p || lower.startsWith(p + '/'))) {
    return res.status(403).end();
  }
  next();
});

// 静态文件服务（只暴露前端需要的目录）
const root = path.join(__dirname, '..');
// js/css 强制 no-cache：让浏览器每次发请求带 If-None-Match 走 304 校验。
// 之前用户多次报"start.bat 进 / 粒子不出来"，根因是 Chrome 把旧版 weather.js 缓存到 disk/memory cache，
// 跳过网络直接命中——新加的 startCardImpacts / .card-cloud-shade / 雪盖逻辑都没生效，体感"粒子坏了"。
const noCache = { setHeaders(res) { res.setHeader('Cache-Control', 'no-cache'); } };
app.use('/css', express.static(path.join(root, 'css'), noCache));
app.use('/js', express.static(path.join(root, 'js'), noCache));
app.use('/bg_png', express.static(path.join(root, 'bg_png')));
app.use('/logo', express.static(path.join(root, 'logo')));
// Lottie 动画素材（雨天积水小动物彩蛋，本地化加载）
app.use('/assets', express.static(path.join(root, 'assets')));
// 词库增强数据分片（ECDICT 词形变化/词频/星级 + Tatoeba 例句），按首字母分片供前端按需 fetch。
// 走长缓存：内容由 scripts/build_wordbank.py 生成，变更时文件名不变但整体重建，属低频变更。
app.use('/wordbank', express.static(path.join(root, 'public', 'wordbank'), {
  maxAge: '7d',
}));
// 看图猜词题型的配图（Openverse CC 授权，署名见 _credits.json）
app.use('/word_images', express.static(path.join(root, 'public', 'word_images'), {
  maxAge: '7d',
}));
function sendIndex(req, res) {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(root, 'ACE-The-CET.html'));
}
app.get('/ACE-The-CET.html', sendIndex);
app.get('/', sendIndex);

// 健康检查（前端 detectServer 用）
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

// SSE 心跳（前端监测服务器是否在线，断开时提示用户）
// 每 IP 最多 3 条并发，避免被恶意打开海量长连接耗资源
const SSE_MAX_PER_IP = 3;
const sseConnsByIp = new Map();
app.get('/api/heartbeat', (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const cur = sseConnsByIp.get(ip) || 0;
  if (cur >= SSE_MAX_PER_IP) {
    return res.status(429).end();
  }
  sseConnsByIp.set(ip, cur + 1);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  let closed = false;
  function cleanup() {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    const left = (sseConnsByIp.get(ip) || 1) - 1;
    if (left <= 0) sseConnsByIp.delete(ip);
    else sseConnsByIp.set(ip, left);
  }
  req.on('close', cleanup);
  res.write('data: ok\n\n');
  const timer = setInterval(() => {
    if (closed) return;
    try { res.write('data: ok\n\n'); } catch { cleanup(); }
  }, 10000);
});

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/geocode', require('./routes/geocode'));

// SPA 回退（仅非 API 路径）
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, '..', 'ACE-The-CET.html'));
});

// 全局错误处理中间件
app.use((err, req, res, _next) => {
  // 客户端 JSON 体解析错误：返回 400 而不是 500
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '请求体不是有效的 JSON' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: '请求体过大' });
  }
  console.error('  [错误]', err.message || err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 等数据库就绪后启动
dbReady.then(() => {
  app.listen(config.port, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║   ACE-The-CET 英语学习系统 v1.0     ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log('  ║                                      ║');
    console.log('  ║   地址: http://localhost:' + config.port + '        ║');
    console.log('  ║   首次使用请在网页注册账号           ║');
    console.log('  ║                                      ║');
    console.log('  ║   关闭此窗口停止服务                 ║');
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');

    // Windows 自动打开浏览器（用 start "" 防止干扰父窗口）
    if (process.platform === 'win32') {
      require('child_process').exec('start "" "http://localhost:' + config.port + '"');
    }
  });
}).catch(err => {
  console.error('  [错误] 数据库初始化失败:', err);
  process.exit(1);
});
