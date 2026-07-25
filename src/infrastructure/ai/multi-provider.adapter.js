'use strict';

class MultiProviderAdapter {
  constructor(providers = {}) {
    this.providers = providers; // e.g. { google: googleProvider, openai: openaiProvider }
  }

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
