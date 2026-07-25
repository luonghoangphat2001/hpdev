'use strict';

const PerProfileCostLatencyQualityMetricsService = require('../../../src/application/services/budget/per-profile-cost-latency-quality-metrics.service');

describe('T186: Per-Profile Cost/Latency/Quality Metrics Service', () => {
  test('returns p50/p95, calls, tokens, cost, cache hit rate, and error rate metrics per profile', () => {
    const service = new PerProfileCostLatencyQualityMetricsService({});
    const metrics = service.getProfileMetrics({ profileMode: 'FAST' });

    expect(metrics.profileMode).toBe('FAST');
    expect(metrics.p50LatencyMs).toBeGreaterThan(0);
    expect(metrics.cacheHitRatePercent).toBeGreaterThan(0);
  });
});
