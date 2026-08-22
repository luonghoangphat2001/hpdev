'use strict';

const OpenAICompatibleProvider = require('./OpenAICompatibleProvider');

/**
 * OpenAI ChatGPT provider.
 */
class ChatGPTProvider extends OpenAICompatibleProvider {
  /**
   * @param {string} apiKey
   * @param {string} modelName
   * @param {string} [baseURL]
   */
  constructor(apiKey, modelName, baseURL) {
    super(apiKey, modelName, baseURL, 'ChatGPT');
  }
}

module.exports = ChatGPTProvider;
