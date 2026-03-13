'use strict';

/**
 * Repository for the key-value config table.
 * Maintains an in-process cache for zero-latency reads.
 */
class ConfigRepository {
  /** @type {import('./Database')} */
  #db;

  /** @type {Map<string, string>} */
  #cache = new Map();

  /** Timestamp of last cache warm — used for TTL-based inter-process refresh */
  #cacheAt = 0;
  static #CACHE_TTL = 15_000; // 15 s — bot picks up dashboard changes within 15 s

  static #DEFAULTS = {
    active_model:          'gemini',
    discord_active_model:  'claude',
    telegram_active_model: 'gemini',
    system_prompt: 'You are a helpful assistant.',
    claude_base_url: '',
    gemini_model:  'models/gemini-2.5-flash',
    claude_model:  'claude-sonnet-4-6',
    chatgpt_model: 'gpt-4o',
  };

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /** Insert defaults and warm the cache. Call once after DB.init(). */
  async init() {
    for (const [key, def] of Object.entries(ConfigRepository.#DEFAULTS)) {
      const value = key === 'claude_base_url' ? (process.env.CLAUDE_BASE_URL || def) : def;
      await this.#db.query(
        'INSERT IGNORE INTO config (`key`, value) VALUES (?, ?)',
        [key, value]
      );
    }

    const rows = await this.#db.query('SELECT `key`, value FROM config');
    for (const row of rows) {
      this.#cache.set(row.key, row.value);
    }
    this.#cacheAt = Date.now();
  }

  /**
   * Re-read all config from DB if the cache is older than CACHE_TTL.
   * Call this at the start of each bot request so model changes from the
   * dashboard (a separate process) are picked up within ~15 seconds.
   */
  async refreshIfNeeded() {
    if (Date.now() - this.#cacheAt < ConfigRepository.#CACHE_TTL) return;
    const rows = await this.#db.query('SELECT `key`, value FROM config');
    for (const row of rows) {
      this.#cache.set(row.key, row.value);
    }
    this.#cacheAt = Date.now();
  }

  /**
   * Synchronous cache read — no DB round-trip.
   * @param {string} key
   * @returns {string|null}
   */
  get(key) {
    return this.#cache.get(key) ?? null;
  }

  /**
   * Persist a value and update the cache.
   * @param {string} key
   * @param {string} value
   */
  async set(key, value) {
    const str = String(value);
    this.#cache.set(key, str);
    await this.#db.query(
      'INSERT INTO config (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, str, str]
    );
  }
}

module.exports = ConfigRepository;
