/**
 * @fileoverview multi-provider.adapter - Provides multi-provider functionality.
 */
'use strict';

/**
 * MultiProviderAdapter
 * Manages multi provider adapter logic.
 */
class MultiProviderAdapter {
  /**
   * constructor - Executes constructor.
   * @param {*} providers - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(providers = {}) {
    this.providers = providers; // e.g. { google: googleProvider, openai: openaiProvider }
  }

  /**
   * generateResponse - Asynchronously executes generate response.
   * @param {*} providerName - Input parameter.
   * @param {*} prompt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async generateResponse({ providerName = 'google', prompt = '' }) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Provider ${providerName} not registered`);
    }

    const res = await provider.complete(prompt);
    return Object.freeze({
      provider: providerName,
      content: res.content || res.text || '',
      raw: res,
    });
  }
}

module.exports = MultiProviderAdapter;
