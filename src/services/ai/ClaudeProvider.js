'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const AIProvider = require('./AIProvider');

/**
 * Anthropic Claude provider.
 * Supports an optional proxy base URL for custom endpoints.
 */
class ClaudeProvider extends AIProvider {
  /** @type {Anthropic} */
  #client;
  /** @type {string} */
  #modelName;

  /**
   * @param {string} apiKey
   * @param {string} modelName
   * @param {string} [baseURL]  optional proxy endpoint
   */
  constructor(apiKey, modelName, baseURL) {
    super();
    this.#client = new Anthropic({ apiKey, baseURL: baseURL || undefined });
    this.#modelName = modelName || 'claude-sonnet-4-6';
  }

  async chat(messages, systemPrompt) {
    const response = await this.#client.messages.create({
      model: this.#modelName,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return {
      text:      response.content[0].text,
      tokensIn:  response.usage?.input_tokens  || 0,
      tokensOut: response.usage?.output_tokens || 0,
    };
  }
}

module.exports = ClaudeProvider;
