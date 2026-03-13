'use strict';

const GeminiProvider  = require('./GeminiProvider');
const ClaudeProvider  = require('./ClaudeProvider');
const ChatGPTProvider = require('./ChatGPTProvider');

/**
 * Factory for AI providers (Factory Pattern).
 * Centralises provider instantiation so callers never import SDK classes directly.
 */
class AIFactory {
  /**
   * @param {'gemini'|'claude'|'chatgpt'} providerName
   * @param {{ geminiModel?: string, claudeModel?: string, claudeBaseUrl?: string, chatgptModel?: string }} config
   * @returns {import('./AIProvider')}
   */
  static create(providerName, { geminiModel, claudeModel, claudeBaseUrl, chatgptModel } = {}) {
    switch (providerName) {
      case 'claude':
        return new ClaudeProvider(process.env.CLAUDE_KEY, claudeModel, claudeBaseUrl);
      case 'chatgpt':
        return new ChatGPTProvider(process.env.OPENAI_KEY, chatgptModel);
      default:
        return new GeminiProvider(process.env.GEMINI_KEY, geminiModel);
    }
  }
}

module.exports = AIFactory;
