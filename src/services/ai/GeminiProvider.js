'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('./AIProvider');

/**
 * Gemini AI provider with automatic 429-quota fallback.
 */
class GeminiProvider extends AIProvider {
  /** @type {GoogleGenerativeAI} */
  #client;
  /** @type {string} */
  #modelName;

  static #FALLBACK_MODEL = 'models/gemini-1.5-flash';

  /**
   * @param {string} apiKey
   * @param {string} modelName
   */
  constructor(apiKey, modelName) {
    super();
    this.#client = new GoogleGenerativeAI(apiKey);
    this.#modelName = modelName || GeminiProvider.#FALLBACK_MODEL;
  }

  async chat(messages, systemPrompt) {
    try {
      return await this.#callGemini(this.#modelName, messages, systemPrompt);
    } catch (err) {
      if ((err.status === 429 || err.status === 404) && this.#modelName !== GeminiProvider.#FALLBACK_MODEL) {
        console.warn(`[Gemini] ${err.status} on ${this.#modelName}, falling back to ${GeminiProvider.#FALLBACK_MODEL}`);
        return await this.#callGemini(GeminiProvider.#FALLBACK_MODEL, messages, systemPrompt);
      }
      throw err;
    }
  }

  /**
   * @param {string} modelName
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   */
  async #callGemini(modelName, messages, systemPrompt) {
    const model = this.#client.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const usage = result.response.usageMetadata || {};
    return {
      text: result.response.text(),
      tokensIn:  usage.promptTokenCount     || 0,
      tokensOut: usage.candidatesTokenCount || 0,
    };
  }
}

module.exports = GeminiProvider;
