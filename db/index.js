const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

// Helper: run query
const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    })
  );

// Helper: get one row
const get = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

// Helper: get all rows
const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

// Sync wrappers using shared in-memory cache for config (fast reads)
const configCache = {};

async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  // Load defaults
  const defaults = {
    active_model: "gemini",
    system_prompt: "You are a helpful assistant.",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await run("INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)", [key, value]);
  }

  // Init dashboard password from env
  const pwRow = await get("SELECT value FROM config WHERE key = 'dashboard_password'");
  if (!pwRow && process.env.DASHBOARD_PASSWORD) {
    const hashed = bcrypt.hashSync(process.env.DASHBOARD_PASSWORD, 10);
    await run("INSERT INTO config (key, value) VALUES (?, ?)", ["dashboard_password", hashed]);
  }

  // Warm up config cache
  const rows = await all("SELECT key, value FROM config");
  for (const r of rows) configCache[r.key] = r.value;

  console.log("DB ready");
}

function getConfig(key) {
  return configCache[key] ?? null;
}

async function setConfig(key, value) {
  configCache[key] = String(value);
  await run("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", [key, String(value)]);
}

async function saveMessage({ channelId, userId, username, role, content, model }) {
  await run(
    "INSERT INTO conversations (channel_id, user_id, username, role, content, model) VALUES (?, ?, ?, ?, ?, ?)",
    [channelId, userId, username, role, content, model]
  );
}

async function getHistory(channelId, limit = 10) {
  const rows = await all(
    "SELECT * FROM conversations WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?",
    [channelId, limit]
  );
  return rows.reverse();
}

async function getAllHistory(limit = 50, offset = 0) {
  return all(
    "SELECT * FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
}

async function getStats() {
  const [total, today, byModel] = await Promise.all([
    get("SELECT COUNT(*) as c FROM conversations"),
    get("SELECT COUNT(*) as c FROM conversations WHERE date(created_at) = date('now')"),
    all("SELECT model, COUNT(*) as count FROM conversations GROUP BY model"),
  ]);
  return { total: total.c, today: today.c, byModel };
}

module.exports = { initDb, getConfig, setConfig, saveMessage, getHistory, getAllHistory, getStats };
