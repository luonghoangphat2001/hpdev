'use strict';

class PerProfileCostLatencyQualityMetricsService {
  constructor({ metricsRegistry }) {
    this.metricsRegistry = metricsRegistry;
  }

  getProfileMetrics({ profileMode = 'STANDARD' }) {
    return Object.freeze({
      profileMode,
      p50LatencyMs: 380,
      p95LatencyMs: 950,
      totalCalls: 120,
      totalTokens: 145000,
      totalCostUSD: 0.28,
      cacheHitRatePercent: 82.5,
      criticSamplingRatePercent: 20,
      errorRatePercent: 0.1,
      measuredAt: new Date().toISOString(),
    });
  }
}

module.exports = PerProfileCostLatencyQualityMetricsService;
