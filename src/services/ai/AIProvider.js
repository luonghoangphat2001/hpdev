'use strict';

/**
 * Abstract base class for AI providers (Strategy Pattern).
 * Each concrete provider encapsulates one AI SDK.
 */
class AIProvider {
  /**
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   * @returns {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async chat(messages, systemPrompt) {
    throw new Error(`${this.constructor.name} must implement chat()`);
  }
}

module.exports = AIProvider;
