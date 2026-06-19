// ========== 学习数据路由 ==========
const router = require('express').Router();
const { getDb, persist } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// 安全解析 JSON（损坏数据不打崩路由）
function safeParse(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

// ===== 偏好路由（必须在 /:level 之前，否则被参数路由截胡） =====

// 获取偏好
router.get('/preferences/all', (req, res) => {
  const db = getDb();
  const rows = db.exec(
    'SELECT pref_key, pref_value FROM user_preferences WHERE user_id = ?',
    [req.user.id]
  );
  const prefs = {};
  if (rows.length > 0) {
    rows[0].values.forEach(([key, val]) => { prefs[key] = val; });
  }
  res.json(prefs);
});

// 保存偏好（限制 key 数量和长度）
const PREF_KEY_LIMIT = 50;
const PREF_VAL_MAX_LEN = 1000;
router.put('/preferences/all', (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: '请求体必须是对象' });
  }
  const entries = Object.entries(req.body);
  if (entries.length > PREF_KEY_LIMIT) {
    return res.status(400).json({ error: '偏好项数量超出限制' });
  }
  const db = getDb();
  for (const [key, value] of entries) {
    if (typeof key !== 'string' || key.length > 100) continue;
    const val = String(value).slice(0, PREF_VAL_MAX_LEN);
    const existing = db.exec(
      'SELECT user_id FROM user_preferences WHERE user_id = ? AND pref_key = ?',
      [req.user.id, key]
    );
    if (existing.length > 0 && existing[0].values.length > 0) {
      db.run('UPDATE user_preferences SET pref_value = ? WHERE user_id = ? AND pref_key = ?',
        [val, req.user.id, key]);
    } else {
      db.run('INSERT INTO user_preferences (user_id, pref_key, pref_value) VALUES (?, ?, ?)',
        [req.user.id, key, val]);
    }
  }
  persist();
  res.json({ ok: true });
});

// ===== 学习数据路由 =====

// 加载学习数据
router.get('/:level', (req, res) => {
  const { level } = req.params;
  if (!['cet4', 'cet6'].includes(level)) {
    return res.status(400).json({ error: '无效等级' });
  }

  const db = getDb();
  let rows = db.exec(
    'SELECT progress, notebook, streak, settings, saved_at FROM user_data WHERE user_id = ? AND level = ?',
    [req.user.id, level]
  );

  // 没有记录就直接返回默认值；真正的写入留到 PUT 触发，避免无效空行
  if (rows.length === 0 || rows[0].values.length === 0) {
    return res.json({
      progress: {}, notebook: {}, streak: {}, settings: { pageSize: 50, dailyGoal: 30 },
      saved_at: null
    });
  }

  const [progress, notebook, streak, settings, saved_at] = rows[0].values[0];
  res.json({
    progress: safeParse(progress, {}),
    notebook: safeParse(notebook, {}),
    streak: safeParse(streak, {}),
    settings: safeParse(settings, {}),
    saved_at
  });
});

// 保存学习数据（带类型校验）
const DATA_MAX_SIZE = 2 * 1024 * 1024; // 2MB per field
router.put('/:level', (req, res) => {
  const { level } = req.params;
  if (!['cet4', 'cet6'].includes(level)) {
    return res.status(400).json({ error: '无效等级' });
  }

  const { progress, notebook, streak, settings } = req.body;

  // 类型校验：必须是对象（或 null/undefined）
  for (const [name, val] of [['progress', progress], ['notebook', notebook], ['streak', streak], ['settings', settings]]) {
    if (val != null && (typeof val !== 'object' || Array.isArray(val))) {
      return res.status(400).json({ error: name + ' 必须是对象' });
    }
  }

  const fields = [
    JSON.stringify(progress || {}),
    JSON.stringify(notebook || {}),
    JSON.stringify(streak || {}),
    JSON.stringify(settings || {})
  ];

  // 大小校验
  if (fields.some(f => f.length > DATA_MAX_SIZE)) {
    return res.status(400).json({ error: '数据大小超出限制' });
  }

  const now = new Date().toISOString();
  const db = getDb();

  const existing = db.exec(
    'SELECT id FROM user_data WHERE user_id = ? AND level = ?',
    [req.user.id, level]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(
      'UPDATE user_data SET progress=?, notebook=?, streak=?, settings=?, saved_at=? WHERE user_id=? AND level=?',
      [...fields, now, req.user.id, level]
    );
  } else {
    db.run(
      'INSERT INTO user_data (user_id, level, progress, notebook, streak, settings, saved_at) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, level, ...fields, now]
    );
  }

  persist();
  res.json({ ok: true, savedAt: now });
});

module.exports = router;
