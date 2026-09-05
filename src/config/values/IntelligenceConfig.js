'use strict';

class IntelligenceConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.warnings = Object.freeze({
      latencyMs: reader.requireNumber('INTELLIGENCE_LATENCY_WARNING_MS'),
      tokens: reader.requireNumber('INTELLIGENCE_TOKEN_WARNING'),
      costUsd: reader.requireNumber('INTELLIGENCE_COST_WARNING_USD'),
    });
    Object.freeze(this);
  }
}

module.exports = IntelligenceConfig;
