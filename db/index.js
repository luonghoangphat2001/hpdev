const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const db = new Database(path.join(__dirname, "data.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function getConfig(key) {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setConfig(key, value) {
  db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(key, String(value));
}

// Initialize defaults on first run
const defaults = {
  active_model: "gemini",
  system_prompt: "You are a helpful assistant.",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!getConfig(key)) setConfig(key, value);
}

if (!getConfig("dashboard_password") && process.env.DASHBOARD_PASSWORD) {
  setConfig("dashboard_password", bcrypt.hashSync(process.env.DASHBOARD_PASSWORD, 10));
}

function saveMessage({ channelId, userId, username, role, content, model }) {
  db.prepare(
    "INSERT INTO conversations (channel_id, user_id, username, role, content, model) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(channelId, userId, username, role, content, model);
}

function getHistory(channelId, limit = 10) {
  return db
    .prepare("SELECT * FROM conversations WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(channelId, limit)
    .reverse();
}

function getAllHistory(limit = 50, offset = 0) {
  return db
    .prepare("SELECT * FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset);
}

function getStats() {
  return {
    total: db.prepare("SELECT COUNT(*) as c FROM conversations").get().c,
    today: db.prepare("SELECT COUNT(*) as c FROM conversations WHERE date(created_at) = date('now')").get().c,
    byModel: db.prepare("SELECT model, COUNT(*) as count FROM conversations GROUP BY model").all(),
  };
}

module.exports = { getConfig, setConfig, saveMessage, getHistory, getAllHistory, getStats };
