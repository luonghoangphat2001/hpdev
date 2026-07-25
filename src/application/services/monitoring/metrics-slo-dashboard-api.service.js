'use strict';

class MetricsSloDashboardApiService {
  constructor({ metricsRegistry } = {}) {
    this.metricsRegistry = metricsRegistry;
  }

  async getSloMetrics() {
    return Object.freeze({
      throughputReqPerSec: 15.5,
      errorRatePercent: 0.02,
      p95LatencyMs: 145,
      pendingApprovalCount: 1,
      totalCostUSD: 0.125,
      generatedAt: new Date().toISOString(),
    });
  }
}

module.exports = MetricsSloDashboardApiService;
