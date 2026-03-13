'use strict';

const OpenAI = require('openai');
const AIProvider = require('./AIProvider');

/**
 * OpenAI ChatGPT provider.
 */
class ChatGPTProvider extends AIProvider {
  /** @type {OpenAI} */
  #client;
  /** @type {string} */
  #modelName;

  /**
   * @param {string} apiKey
   * @param {string} modelName
   */
  constructor(apiKey, modelName) {
    super();
    this.#client    = new OpenAI({ apiKey });
    this.#modelName = modelName || 'gpt-4o';
  }

  async chat(messages, systemPrompt) {
    const response = await this.#client.chat.completions.create({
      model: this.#modelName,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    return {
      text:      response.choices[0].message.content,
      tokensIn:  response.usage?.prompt_tokens     || 0,
      tokensOut: response.usage?.completion_tokens || 0,
    };
  }
}

module.exports = ChatGPTProvider;
