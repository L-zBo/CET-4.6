// ========== ACE-The-CET 服务端配置 ==========
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// JWT 密钥：首次运行自动生成并持久化
const dataDir = path.join(__dirname, 'data');
const secretFile = path.join(dataDir, '.jwt_secret');
let jwtSecret;
try {
  jwtSecret = fs.readFileSync(secretFile, 'utf8').trim();
} catch {
  fs.mkdirSync(dataDir, { recursive: true });
  jwtSecret = crypto.randomBytes(64).toString('hex');
  fs.writeFileSync(secretFile, jwtSecret);
}

module.exports = {
  port: process.env.PORT || 3456,
  jwtSecret,
  dbPath: path.join(dataDir, 'cet.db'),
  tokenExpiry: '7d',
  // 管理员账号（首次启动自动创建）
  adminUsername: 'admin',
  adminDefaultPassword: 'admin888'
};
