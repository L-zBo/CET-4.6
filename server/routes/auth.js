// ========== 认证路由 ==========
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb, persist } = require('../db');
const { authRequired, invalidateUserCache } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

// 用户名校验：字母、数字、中文、下划线、连字符
const USERNAME_RE = /^[\w一-龥\-]{2,20}$/;

// 限流：登录/注册每 IP 每分钟最多 10 次（注册更严：每 5 分钟 5 次）
const loginLimiter = createRateLimiter({
  windowMs: 60 * 1000, max: 10,
  message: '登录尝试过于频繁，请稍后再试'
});
const registerLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, max: 5,
  message: '注册请求过于频繁，请稍后再试'
});
const changePwdLimiter = createRateLimiter({
  windowMs: 60 * 1000, max: 5,
  message: '操作过于频繁，请稍后再试'
});

// 注册
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: '用户名 2-20 个字符，仅支持字母、数字、中文、下划线' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: '密码至少 4 位' });
    }

    const db = getDb();
    const existing = db.exec("SELECT id FROM users WHERE username = ?", [username]);

    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, 'user']);
    persist();

    const rows = db.exec('SELECT last_insert_rowid() as id');
    const userId = rows[0].values[0][0];

    const user = { id: userId, username, role: 'user' };
    const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.tokenExpiry });
    res.json({ token, user });
  } catch (e) {
    console.error('  [注册错误]', e.message);
    res.status(500).json({ error: '注册失败，请重试' });
  }
});

// 登录
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const db = getDb();
    const rows = db.exec('SELECT id, username, password, role FROM users WHERE username = ?',
      [username]);

    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const [id, uname, hash, role] = rows[0].values[0];
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    db.run("UPDATE users SET last_login = datetime('now','localtime') WHERE id = ?", [id]);
    persist();

    const user = { id, username: uname, role };
    const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.tokenExpiry });
    res.json({ token, user });
  } catch (e) {
    console.error('  [登录错误]', e.message);
    res.status(500).json({ error: '登录失败，请重试' });
  }
});

// 获取当前用户信息
router.get('/me', authRequired, (req, res) => {
  const db = getDb();
  const rows = db.exec('SELECT id, username, role FROM users WHERE id = ?', [req.user.id]);
  if (rows.length === 0 || rows[0].values.length === 0) {
    return res.status(404).json({ error: '用户不存在' });
  }
  const [id, username, role] = rows[0].values[0];
  res.json({ id, username, role });
});

// 修改密码
router.post('/change-password', authRequired, changePwdLimiter, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: '新密码至少 4 位' });
    }

    const db = getDb();
    const rows = db.exec('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const [hash] = rows[0].values[0];
    const ok = await bcrypt.compare(oldPassword, hash);
    if (!ok) {
      return res.status(401).json({ error: '原密码错误' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, req.user.id]);
    persist();
    invalidateUserCache(req.user.id);
    res.json({ ok: true });
  } catch (e) {
    console.error('  [改密码错误]', e.message);
    res.status(500).json({ error: '修改失败，请重试' });
  }
});

// 修改自己的用户名
router.post('/change-username', authRequired, changePwdLimiter, (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username || !USERNAME_RE.test(username)) {
      return res.status(400).json({ error: '用户名 2-20 个字符，仅支持字母、数字、中文、下划线' });
    }

    const db = getDb();
    const dup = db.exec('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
    if (dup.length > 0 && dup[0].values.length > 0) {
      return res.status(409).json({ error: '用户名已被占用' });
    }

    db.run('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id]);
    persist();
    invalidateUserCache(req.user.id);
    const user = { id: req.user.id, username, role: req.user.role };
    const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.tokenExpiry });
    res.json({ ok: true, token, user });
  } catch (e) {
    console.error('  [改用户名错误]', e.message);
    res.status(500).json({ error: '修改失败，请重试' });
  }
});

module.exports = router;
