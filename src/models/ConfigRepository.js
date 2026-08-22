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
  static #CACHE_TTL = 5_000; // 5 s — bot/dashboard picks up config changes quickly

  static #DEFAULTS = {
    active_model: 'gemini',
    learning_active_model: 'gemini',
    discord_active_model: 'claude',
    telegram_active_model: 'gemini',
    system_prompt: 'You are a helpful assistant.',
    claude_base_url: process.env.CLAUDE_API_BASE_URL || process.env.CLAUDE_BASE_URL || '',
    gemini_model: 'models/gemini-2.5-flash',
    claude_model: 'claude-sonnet-4-6',
    chatgpt_model: 'gpt-4o',
    deepseek_model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
    vllm_model: process.env.VLLM_MODEL || 'llama3.1',
    kimi_model: process.env.KIMI_MODEL || 'kimi-k2.6',
    ollama_model: process.env.OLLAMA_MODEL || 'llama3.1',
    nvidia_model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct',
    cloudflare_model: process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct',
    agent_dan_rnd_primary: 'gemini:models/gemini-2.5-flash',
    agent_dan_rnd_fallback: 'claude:claude-sonnet-4-6',
    agent_dan_logistics_primary: 'gemini:models/gemini-2.5-flash',
    agent_dan_logistics_fallback: 'claude:claude-sonnet-4-6',
    agent_dan_cfo_primary: 'gemini:models/gemini-2.5-flash',
    agent_dan_cfo_fallback: 'claude:claude-sonnet-4-6',
    agent_dan_ops_primary: 'gemini:models/gemini-2.5-flash',
    agent_dan_ops_fallback: 'claude:claude-sonnet-4-6',
    agent_dan_cskh_primary: 'gemini:models/gemini-2.5-flash',
    agent_dan_cskh_fallback: 'claude:claude-sonnet-4-6',
    schedule_discord_channel_id: '',
    schedule_timezone: 'Asia/Ho_Chi_Minh',
    vocab_enabled: 'true',
    notify_vocab_enabled: 'true',
    notify_tech_enabled: 'false',
    notify_quiz_enabled: 'false',
    notify_ielts_enabled: 'false',
    vocab_daily_time: '08:00',
    vocab_words_per_day: '5',
    vocab_discord_channel_id: '',
    vocab_topic_mode: 'sequential',
    vocab_current_topic_no: '1',
    vocab_last_sent_date: '',
    vocab_dictionary_api_url: process.env.DICTIONARY_API_URL || 'https://api.dictionaryapi.dev/api/v2/entries/en',
    openclaw_url: process.env.OPENCLAW_URL || process.env.OPENCLAW_BASE_URL || '',
    openclaw_enabled: 'true',
    google_cx: '',
    log_retention_days: '14',
    learning_prompt_tech: '',
    learning_prompt_vocab: '',
    learning_prompt_quiz: '',
    learning_prompt_reading: '',
    learning_prompt_writing: '',
    learning_prompt_speaking: '',
    learning_prompt_ielts: '',
    learning_prompt_eval_tech: '',
    learning_prompt_eval_reading: '',
    learning_prompt_eval_writing: '',
    learning_prompt_eval_speaking: '',
    learning_prompt_eval_ielts: '',
  };

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /** Insert defaults and warm the cache. Call once after DB.init(). */
  async init() {
    for (const [key, def] of Object.entries(ConfigRepository.#DEFAULTS)) {
      await this.#db.query(
        'INSERT IGNORE INTO config (`key`, value) VALUES (?, ?)',
        [key, def]
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
