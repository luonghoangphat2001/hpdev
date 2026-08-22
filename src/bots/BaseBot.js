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
    this.#platform = platform;
  }

  /** Expose aiService to subclasses (read-only). */
  get _aiService() { return this.#aiService; }

  /** Platform identifier ('discord' | 'telegram' | null). */
  get _platform() { return this.#platform; }

  /**
   * Handle a "đần" message end-to-end:
   *   1. Empty prompt after stripping the bot prefix → reply and return { handled: true }
   *   2. Every non-empty request → return { handled: false, prompt } for semantic routing.
   *
   * @param {string} text - Full message text
   * @param {(s: string) => Promise<void>} reply - Platform reply callback
   * @returns {Promise<{ handled: true } | { handled: false, prompt: string }>}
   */
  /**
   * Shared helper for "thinking..." UI + AI call + final reply/error handling.
   * Each bot provides its own transport-specific callbacks.
   *
   * @param {{
   *   createThinking?: () => Promise<any>,
   *   deleteThinking?: (thinking: any) => Promise<any>,
   *   run: () => Promise<string>,
   *   reply: (text: string) => Promise<any>,
   *   truncate?: (text: string) => string,
   *   errorReply?: (err: Error) => string,
   * }} opts
   */
  async _replyWithThinking({
    createThinking = null,
    deleteThinking = null,
    run,
    reply,
    truncate = (text) => text,
    errorReply = (err) => `❌ ${err.message}`,
  }) {
    let thinking = null;
    try {
      if (createThinking) thinking = await createThinking();
    } catch (_) { }

    const safeDelete = async () => {
      if (!deleteThinking) return;
      try { await deleteThinking(thinking); } catch (_) { }
    };

    try {
      const result = await run();
      await safeDelete();
      const output = typeof result === 'string' ? result.trim() : result;
      if (!output) throw new Error('AI returned an empty response');
      await reply(truncate(output));
    } catch (err) {
      console.error('[Bot] command failed:', err);
      await safeDelete();
      await reply(errorReply(err)).catch(() => { });
    }
  }

  async _handleDanCommand(text, reply) {
    // Strip "đần" greeting prefix — keep original diacritics for the AI prompt
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
