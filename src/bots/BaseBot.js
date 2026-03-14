'use strict';

/**
 * Shared base class for all bot implementations.
 * Centralises model switch/check command handling so each platform
 * bot only needs to supply a platform-specific reply callback.
 */
class BaseBot {
  /** @type {import('../services/AIService')} */
  #aiService;

  /** @type {string|null} */
  #platform;

  /**
   * @param {import('../services/AIService')} aiService
   * @param {string|null} [platform]
   */
  constructor(aiService, platform = null) {
    this.#aiService = aiService;
    this.#platform  = platform;
  }

  /** Expose aiService to subclasses (read-only). */
  get _aiService() { return this.#aiService; }

  /** Platform identifier ('discord' | 'telegram' | null). */
  get _platform() { return this.#platform; }

  /**
   * Handle a "đần" message end-to-end:
   *   1. Model switch/check commands → reply and return { handled: true }
   *   2. Empty prompt after stripping prefix → reply and return { handled: true }
   *   3. Normal query → return { handled: false, prompt }
   *
   * @param {string} text - Full message text
   * @param {(s: string) => Promise<void>} reply - Platform reply callback
   * @returns {Promise<{ handled: true } | { handled: false, prompt: string }>}
   */
  /**
   * Strip Vietnamese diacritics → plain ASCII lowercase for easy regex matching.
   * e.g. "Đần mày đang Sài model nào" → "dan may dang sai model nao"
   * @param {string} str
   * @returns {string}
   */
  static #norm(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // remove combining diacritics
      .replace(/[đĐ]/g, (c) => c === 'đ' ? 'd' : 'D')
      .toLowerCase();
  }

  async _handleDanCommand(text, reply) {
    const n = BaseBot.#norm(text);

    const MODEL_SWITCHES = [
      { re: /chuyen\s+model\s+sang\s+claude/,               key: 'claude'  },
      { re: /chuyen\s+model\s+sang\s+gemini/,               key: 'gemini'  },
      { re: /chuyen\s+model\s+sang\s+(chatgpt|gpt|openai)/, key: 'chatgpt' },
    ];

    for (const { re, key } of MODEL_SWITCHES) {
      if (re.test(n)) {
        const label = await this.#aiService.setModel(key, this.#platform);
        await reply(`✅ Đã chuyển sang **${label}**!`);
        return { handled: true };
      }
    }

    if (/dang\s+(dung|sai|su\s*dung)\s+model/.test(n) ||
        /model\s+(hien\s+tai|dang\s+(dung|sai))/.test(n) ||
        /model\s+(nao|gi)/.test(n)) {
      const { label } = this.#aiService.currentModel(this.#platform);
      await reply(`🤖 Tao đang dùng **${label}** nè!`);
      return { handled: true };
    }

    // Strip "đần" greeting prefix — keep original diacritics for the AI prompt
    const prompt = text
      .replace(/^(ê|này|hey|oi|ơi|à)?\s*đần\s*(ơi|oi|à|ê|hey)?\s*/i, '')
      .trim();

    if (!prompt) {
      await reply('Gọi tao hả? Hỏi gì đi 😤');
      return { handled: true };
    }

    // Detect schedule intents (checked on normalised text)
    const np = BaseBot.#norm(prompt);
    const SCHEDULE_INTENTS = [
      /them\s+(lich|reminder|nhac)/,
      /dat\s+(lich|nhac)/,
      /nhac\s+toi/,
      /lich\s+(hoc|lam|viec)/,
      /xem\s+(lich|reminder)/,
      /xoa\s+(lich|reminder)/,
    ];
    const isSchedule = SCHEDULE_INTENTS.some((re) => re.test(np));

    return { handled: false, prompt, isSchedule };
  }
}

module.exports = BaseBot;
