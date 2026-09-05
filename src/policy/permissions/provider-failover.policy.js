/**
 * @fileoverview provider-failover.policy - Provides provider-failover functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * ProviderFailoverPolicy
 * Manages provider failover logic.
 */
class ProviderFailoverPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} multiProviderAdapter - Input parameter.
   * @param {*} primaryProvider - Input parameter.
   * @param {*} fallbackProvider - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ multiProviderAdapter, primaryProvider = 'google', fallbackProvider = 'openai' }) {
    super({ name: 'ProviderFailoverPolicy' });


    this.multiProviderAdapter = multiProviderAdapter;
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
  }

  /**
   * executeWithFailover - Asynchronously executes execute with failover.
   * @param {*} prompt - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

module.exports = ProviderFailoverPolicy;
