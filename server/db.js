// ========== ACE-The-CET 数据库模块 (sql.js) ==========
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const bcrypt = require('bcryptjs');

let db = null;

// sql.js 是异步初始化，导出一个 ready promise
const dbReady = (async () => {
  const SQL = await initSqlJs();

  // 如果已有数据库文件则加载，否则新建
  if (fs.existsSync(config.dbPath)) {
    const buf = fs.readFileSync(config.dbPath);
    db = new SQL.Database(buf);
  } else {
    fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
    db = new SQL.Database();
  }

  // 启用外键约束（sql.js 默认关闭，导致 ON DELETE CASCADE 失效）
  db.run('PRAGMA foreign_keys = ON');

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    UNIQUE NOT NULL,
      password    TEXT    NOT NULL,
      role        TEXT    DEFAULT 'user',
      created_at  TEXT    DEFAULT (datetime('now','localtime')),
      last_login  TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_data (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      level       TEXT    NOT NULL,
      progress    TEXT    DEFAULT '{}',
      notebook    TEXT    DEFAULT '{}',
      streak      TEXT    DEFAULT '{}',
      settings    TEXT    DEFAULT '{"pageSize":50,"dailyGoal":30}',
      saved_at    TEXT    DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, level),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id     INTEGER NOT NULL,
      pref_key    TEXT    NOT NULL,
      pref_value  TEXT,
      UNIQUE(user_id, pref_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 自动创建管理员账号
  const admin = db.exec('SELECT id FROM users WHERE username = ?', [config.adminUsername]);
  if (admin.length === 0 || admin[0].values.length === 0) {
    const hash = bcrypt.hashSync(config.adminDefaultPassword, 10);
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [config.adminUsername, hash, 'admin']);
    // 安全：不在启动窗口打印明文密码（防肩窥）。
    // 默认凭据请查 管理员须知.txt（仅管理员可见）。
    console.log('  [DB] 已自动创建管理员账号（默认凭据请查 管理员须知.txt）');
  }

  // 持久化
  persist();
  console.log('  [DB] 数据库就绪: ' + config.dbPath);
  return db;
})();

// 将内存数据库写入磁盘文件
function persist() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.dbPath, buffer);
  } catch (e) {
    console.error('  [DB] 持久化失败:', e.message);
  }
}

// 定期自动持久化（每 30 秒）
setInterval(() => persist(), 30000);

// 进程退出时保存
process.on('exit', () => persist());
process.on('SIGINT', () => { persist(); process.exit(); });
process.on('SIGTERM', () => { persist(); process.exit(); });

module.exports = { getDb: () => db, dbReady, persist };
