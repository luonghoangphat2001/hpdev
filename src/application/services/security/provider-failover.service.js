'use strict';

class ProviderFailoverService {
  constructor({ multiProviderAdapter, primaryProvider = 'google', fallbackProvider = 'openai' }) {
    this.multiProviderAdapter = multiProviderAdapter;
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
  }

  async executeWithFailover(prompt) {
    try {
      return await this.multiProviderAdapter.generateResponse({ providerName: this.primaryProvider, prompt });
    } catch (err) {
      try {
        const fallbackRes = await this.multiProviderAdapter.generateResponse({ providerName: this.fallbackProvider, prompt });
        return Object.freeze({ ...fallbackRes, failoverUsed: true, primaryError: err.message });
      } catch (fallbackErr) {
        return Object.freeze({ degraded: true, mode: 'MANUAL_REVIEW', error: fallbackErr.message });
      }
    }
  }
}

module.exports = ProviderFailoverService;
