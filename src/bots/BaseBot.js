'use strict';

/**
 * Shared base class for all bot implementations.
 * Centralises model switch/check command handling so each platform
 * bot only needs to supply a platform-specific reply callback.
 */
class BaseBot {
  /** @type {import('../services/AIService')} */
  #aiService;

  /** @param {import('../services/AIService')} aiService */
  constructor(aiService) {
    this.#aiService = aiService;
  }

  /** Expose aiService to subclasses (read-only). */
  get _aiService() { return this.#aiService; }

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
  async _handleDanCommand(text, reply) {
    const lower = text.toLowerCase();

    const MODEL_SWITCHES = [
      { re: /chuy[eê]n\s+model\s+sang\s+claude/i,                key: 'claude'  },
      { re: /chuy[eê]n\s+model\s+sang\s+gemini/i,                key: 'gemini'  },
      { re: /chuy[eê]n\s+model\s+sang\s+(chatgpt|gpt|openai)/i,  key: 'chatgpt' },
    ];

    for (const { re, key } of MODEL_SWITCHES) {
      if (re.test(lower)) {
        const label = await this.#aiService.setModel(key);
        await reply(`✅ Đã chuyển sang **${label}**!`);
        return { handled: true };
      }
    }

    if (/đang\s+d[uù]ng\s+model\s+g[ìi]/i.test(lower) ||
        /model\s+(hi[eệ]n\s+t[aạ]i|đang\s+d[uù]ng)/i.test(lower)) {
      const { label } = this.#aiService.currentModel();
      await reply(`🤖 Tao đang dùng **${label}** nè!`);
      return { handled: true };
    }

    const prompt = text
      .replace(/^(ê|này|hey|oi|ơi|à)?\s*đần\s*(ơi|oi|à|ê|hey)?\s*/i, '')
      .trim();

    if (!prompt) {
      await reply('Gọi tao hả? Hỏi gì đi 😤');
      return { handled: true };
    }

    return { handled: false, prompt };
  }
}

module.exports = BaseBot;
