// ========== 管理员路由 ==========
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getDb, persist } = require('../db');
const { adminRequired, invalidateUserCache } = require('../middleware/auth');

router.use(adminRequired);

// 安全解析 JSON
function safeParse(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

// 校验 :id 参数
function parseId(req, res) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: '无效的用户 ID' }); return null; }
  return id;
}

// 用户列表
router.get('/users', (req, res) => {
  const db = getDb();
  const rows = db.exec(
    'SELECT id, username, role, created_at, last_login FROM users ORDER BY created_at DESC'
  );
  if (rows.length === 0) return res.json([]);

  const cols = rows[0].columns;
  const users = rows[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
  res.json(users);
});

// 查看某用户学习数据概览
router.get('/users/:id/stats', (req, res) => {
  try {
    const userId = parseId(req, res);
    if (userId === null) return;

    const db = getDb();
    const userRows = db.exec(
      'SELECT id, username, role, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );
    if (userRows.length === 0 || userRows[0].values.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const [id, username, role, created_at, last_login] = userRows[0].values[0];

    const dataRows = db.exec(
      'SELECT level, progress, notebook, streak, saved_at FROM user_data WHERE user_id = ?',
      [userId]
    );
    const levels = {};
    if (dataRows.length > 0) {
      dataRows[0].values.forEach(([level, progressJson, notebookJson, streakJson, saved_at]) => {
        const progress = safeParse(progressJson, {});
        const streak = safeParse(streakJson, {});
        const notebook = safeParse(notebookJson, {});
        const wordCount = Object.keys(progress).length;
        const mastered = Object.values(progress).filter(p => p?.status === 'mastered').length;
        const learning = Object.values(progress).filter(p => p?.status === 'learning').length;

        const dates = streak.dates || {};
        const dailyHistory = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().slice(0, 10);
          const dayInfo = dates[ds];
          dailyHistory.push({
            date: ds,
            learned: dayInfo?.learned || 0,
            words: (dayInfo?.words || []).length
          });
        }

        const totalDays = Object.values(dates).filter(d => d?.learned > 0).length;
        const notebookCount = Object.keys(notebook).length;

        levels[level] = {
          wordCount, mastered, learning,
          currentStreak: streak.currentStreak || 0,
          longestStreak: streak.longestStreak || streak.currentStreak || 0,
          totalDays, notebookCount, dailyHistory, saved_at
        };
      });
    }

    res.json({ id, username, role, created_at, last_login, levels });
  } catch (e) {
    console.error('  [管理-用户详情错误]', e.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 修改用户名
router.put('/users/:id/username', (req, res) => {
  try {
    const userId = parseId(req, res);
    if (userId === null) return;
    const { username } = req.body || {};
    if (!username || username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名需要 2-20 个字符' });
    }

    const db = getDb();
    const rows = db.exec('SELECT id FROM users WHERE id = ?', [userId]);
    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const dup = db.exec('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (dup.length > 0 && dup[0].values.length > 0) {
      return res.status(409).json({ error: '用户名已被占用' });
    }

    db.run('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
    persist();
    invalidateUserCache(userId);
    res.json({ ok: true });
  } catch (e) {
    console.error('  [管理-改名错误]', e.message);
    res.status(500).json({ error: '修改失败' });
  }
});

// 重置用户密码
router.put('/users/:id/password', async (req, res) => {
  try {
    const userId = parseId(req, res);
    if (userId === null) return;
    const { password } = req.body || {};
    if (!password || password.length < 4) {
      return res.status(400).json({ error: '密码至少 4 位' });
    }

    const db = getDb();
    const rows = db.exec('SELECT id FROM users WHERE id = ?', [userId]);
    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const hash = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    persist();
    invalidateUserCache(userId);
    res.json({ ok: true });
  } catch (e) {
    console.error('  [管理-改密码错误]', e.message);
    res.status(500).json({ error: '修改失败' });
  }
});

// 删除用户
router.delete('/users/:id', (req, res) => {
  try {
    const userId = parseId(req, res);
    if (userId === null) return;
    if (userId === req.user.id) {
      return res.status(400).json({ error: '不能删除自己' });
    }

    const db = getDb();
    const rows = db.exec('SELECT role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    db.run('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
    db.run('DELETE FROM user_data WHERE user_id = ?', [userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId]);
    persist();
    invalidateUserCache(userId);
    res.json({ ok: true });
  } catch (e) {
    console.error('  [管理-删除用户错误]', e.message);
    res.status(500).json({ error: '删除失败' });
  }
});

// 系统统计
router.get('/stats', (req, res) => {
  const db = getDb();
  const userCount = db.exec('SELECT COUNT(*) FROM users')[0].values[0][0];
  const dataCount = db.exec('SELECT COUNT(*) FROM user_data')[0].values[0][0];
  const activeRows = db.exec(
    "SELECT COUNT(*) FROM users WHERE last_login >= date('now','localtime')"
  );
  const todayActive = activeRows[0].values[0][0];
  res.json({ userCount, dataCount, todayActive });
});

module.exports = router;
