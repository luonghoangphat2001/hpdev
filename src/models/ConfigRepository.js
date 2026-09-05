'use strict';

/**
 * Repository for the key-value config table.
 * Maintains an in-process cache for zero-latency reads.
 * All initial configurations are resolved from ENV variables with fail-fast try/catch.
 * Zero || fallback operators.
 */
class ConfigRepository {
  /** @type {import('@models/Database')} */
  #db;

  /** @type {Map<string, string>} */
  #cache = new Map();

  /** Timestamp of last cache warm — used for TTL-based inter-process refresh */
  #cacheAt = 0;
  static #CACHE_TTL = 5_000;

  static #ENV_MAPPINGS = Object.freeze({
    active_model: 'ACTIVE_MODEL',
    learning_active_model: 'LEARNING_ACTIVE_MODEL',
    discord_active_model: 'DISCORD_ACTIVE_MODEL',
    telegram_active_model: 'TELEGRAM_ACTIVE_MODEL',
    system_prompt: 'SYSTEM_PROMPT',
    claude_base_url: 'CLAUDE_BASE_URL',
    gemini_model: 'GEMINI_MODEL',
    claude_model: 'CLAUDE_MODEL',
    chatgpt_model: 'CHATGPT_MODEL',
    deepseek_model: 'DEEPSEEK_MODEL',
    vllm_model: 'VLLM_MODEL',
    kimi_model: 'KIMI_MODEL',
    ollama_model: 'OLLAMA_MODEL',
    nvidia_model: 'NVIDIA_MODEL',
    cloudflare_model: 'CLOUDFLARE_MODEL',
    agent_dan_rnd_primary: 'AGENT_DAN_RND_PRIMARY',
    agent_dan_rnd_fallback: 'AGENT_DAN_RND_FALLBACK',
    agent_dan_logistics_primary: 'AGENT_DAN_LOGISTICS_PRIMARY',
    agent_dan_logistics_fallback: 'AGENT_DAN_LOGISTICS_FALLBACK',
    agent_dan_cfo_primary: 'AGENT_DAN_CFO_PRIMARY',
    agent_dan_cfo_fallback: 'AGENT_DAN_CFO_FALLBACK',
    agent_dan_ops_primary: 'AGENT_DAN_OPS_PRIMARY',
    agent_dan_ops_fallback: 'AGENT_DAN_OPS_FALLBACK',
    agent_dan_cskh_primary: 'AGENT_DAN_CSKH_PRIMARY',
    agent_dan_cskh_fallback: 'AGENT_DAN_CSKH_FALLBACK',
    schedule_discord_channel_id: 'SCHEDULE_DISCORD_CHANNEL_ID',
    schedule_timezone: 'SCHEDULE_TIMEZONE',
    vocab_enabled: 'VOCAB_ENABLED',
    notify_vocab_enabled: 'NOTIFY_VOCAB_ENABLED',
    notify_tech_enabled: 'NOTIFY_TECH_ENABLED',
    notify_quiz_enabled: 'NOTIFY_QUIZ_ENABLED',
    notify_ielts_enabled: 'NOTIFY_IELTS_ENABLED',
    vocab_daily_time: 'VOCAB_DAILY_TIME',
    vocab_words_per_day: 'VOCAB_WORDS_PER_DAY',
    vocab_discord_channel_id: 'VOCAB_DISCORD_CHANNEL_ID',
    vocab_topic_mode: 'VOCAB_TOPIC_MODE',
    vocab_current_topic_no: 'VOCAB_CURRENT_TOPIC_NO',
    vocab_last_sent_date: 'VOCAB_LAST_SENT_DATE',
    vocab_dictionary_api_url: 'DICTIONARY_API_URL',
    openclaw_url: 'OPENCLAW_API_URL',
    openclaw_enabled: 'OPENCLAW_ENABLED',
    google_cx: 'GOOGLE_CX',
    log_retention_days: 'LOG_RETENTION_DAYS',
    learning_prompt_tech: 'LEARNING_PROMPT_TECH',
    learning_prompt_vocab: 'LEARNING_PROMPT_VOCAB',
    learning_prompt_quiz: 'LEARNING_PROMPT_QUIZ',
    learning_prompt_reading: 'LEARNING_PROMPT_READING',
    learning_prompt_writing: 'LEARNING_PROMPT_WRITING',
    learning_prompt_speaking: 'LEARNING_PROMPT_SPEAKING',
    learning_prompt_ielts: 'LEARNING_PROMPT_IELTS',
    learning_prompt_eval_tech: 'LEARNING_PROMPT_EVAL_TECH',
    learning_prompt_eval_reading: 'LEARNING_PROMPT_EVAL_READING',
    learning_prompt_eval_writing: 'LEARNING_PROMPT_EVAL_WRITING',
    learning_prompt_eval_speaking: 'LEARNING_PROMPT_EVAL_SPEAKING',
    learning_prompt_eval_ielts: 'LEARNING_PROMPT_EVAL_IELTS',
  });

  /** @param {import('@models/Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * Reads initial configuration strictly from ENV variables.
   * Logs warnings with try/catch when an env variable is absent. Zero || operators.
   * @returns {Record<string, string>}
   */
  #resolveEnvConfig() {
    const configMap = {};
    for (const [key, envVar] of Object.entries(ConfigRepository.#ENV_MAPPINGS)) {
      try {
        const val = process.env[envVar];
        if (val === undefined || val === null) {
          throw new Error(`[ConfigRepository] Env variable '${envVar}' is not defined for key '${key}'`);
        }
        configMap[key] = String(val).trim();
      } catch (err) {
        console.warn(err.message);
        configMap[key] = '';
      }
    }
    return configMap;
  }

  /** Insert env-driven config and warm the cache. Call once after DB.init(). */
  async init() {
    const configMap = this.#resolveEnvConfig();
    for (const [key, val] of Object.entries(configMap)) {
      await this.#db.query(
        'INSERT IGNORE INTO config (`key`, value) VALUES (?, ?)',
        [key, val]
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
    if (!this.#cache.has(key)) {
      return null;
    }
    return this.#cache.get(key);
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
