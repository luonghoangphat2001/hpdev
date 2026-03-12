const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

let pool;
const configCache = {};

async function initDb() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      channel_id VARCHAR(32) NOT NULL,
      user_id VARCHAR(32) NOT NULL,
      username VARCHAR(64) NOT NULL,
      role VARCHAR(16) NOT NULL,
      content TEXT NOT NULL,
      model VARCHAR(32),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_channel (channel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS config (
      \`key\` VARCHAR(64) PRIMARY KEY,
      value TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Insert defaults if not exist
  const defaults = {
    active_model: "gemini",
    system_prompt: "You are a helpful assistant.",
    claude_base_url: process.env.CLAUDE_BASE_URL || "",
    gemini_model: "models/gemini-2.5-flash",
    claude_model: "claude-sonnet-4-6",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await pool.execute(
      "INSERT IGNORE INTO config (`key`, value) VALUES (?, ?)",
      [key, value]
    );
  }

  // Init dashboard password from env
  const [[pwRow]] = await pool.execute(
    "SELECT value FROM config WHERE `key` = 'dashboard_password'"
  );
  if (!pwRow && process.env.DASHBOARD_PASSWORD) {
    const hashed = bcrypt.hashSync(process.env.DASHBOARD_PASSWORD, 10);
    await pool.execute(
      "INSERT INTO config (`key`, value) VALUES ('dashboard_password', ?)",
      [hashed]
    );
  }

  // Warm config cache
  const [rows] = await pool.execute("SELECT `key`, value FROM config");
  for (const r of rows) configCache[r.key] = r.value;

  console.log("DB ready");
}

function getConfig(key) {
  return configCache[key] ?? null;
}

async function setConfig(key, value) {
  configCache[key] = String(value);
  await pool.execute(
    "INSERT INTO config (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
    [key, String(value), String(value)]
  );
}

async function saveMessage({ channelId, userId, username, role, content, model }) {
  await pool.execute(
    "INSERT INTO conversations (channel_id, user_id, username, role, content, model) VALUES (?, ?, ?, ?, ?, ?)",
    [channelId, userId, username, role, content, model]
  );
}

async function getHistory(channelId, limit = 10) {
  const [rows] = await pool.execute(
    "SELECT * FROM (SELECT * FROM conversations WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?) t ORDER BY created_at ASC",
    [channelId, limit]
  );
  return rows;
}

async function getAllHistory(limit = 50, offset = 0) {
  const [rows] = await pool.execute(
    "SELECT * FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  return rows;
}

async function getStats() {
  const [[total]] = await pool.execute("SELECT COUNT(*) as c FROM conversations");
  const [[today]] = await pool.execute(
    "SELECT COUNT(*) as c FROM conversations WHERE DATE(created_at) = CURDATE()"
  );
  const [byModel] = await pool.execute(
    "SELECT model, COUNT(*) as count FROM conversations GROUP BY model"
  );
  return { total: total.c, today: today.c, byModel };
}

module.exports = { initDb, getConfig, setConfig, saveMessage, getHistory, getAllHistory, getStats };
