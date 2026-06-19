// ========== JWT 认证中间件 ==========
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb } = require('../db');

// 用户存在性 + 角色 缓存（避免每请求都查库）
const USER_CACHE_TTL = 60 * 1000;
const userCache = new Map(); // userId → { exists, role, expireAt }

function getUserStatus(userId) {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expireAt > now) return cached;
  const db = getDb();
  const rows = db.exec('SELECT role FROM users WHERE id = ?', [userId]);
  const exists = rows.length > 0 && rows[0].values.length > 0;
  const role = exists ? rows[0].values[0][0] : null;
  const entry = { exists, role, expireAt: now + USER_CACHE_TTL };
  userCache.set(userId, entry);
  return entry;
}

// 让外部（删除/改密码后）能立即让缓存失效
function invalidateUserCache(userId) {
  if (userId == null) userCache.clear();
  else userCache.delete(userId);
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
  // 校验用户当前是否仍存在（已删除的用户不应放行）
  const status = getUserStatus(req.user.id);
  if (!status.exists) {
    return res.status(401).json({ error: '用户不存在或已被删除' });
  }
  // 用 DB 中最新的角色覆盖 JWT 内可能过期的 role
  req.user.role = status.role;
  next();
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  });
}

module.exports = { authRequired, adminRequired, invalidateUserCache };
