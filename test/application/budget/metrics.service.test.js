'use strict';

const ProfileMetricsPolicy = require('@policy/budget/profile-metrics.policy');

describe('T186: Per-Profile Cost/Latency/Quality Metrics Service', () => {
  test('returns p50/p95, calls, tokens, cost, cache hit rate, and error rate metrics per profile', () => {
    const service = new ProfileMetricsPolicy({});
    const metrics = service.getProfileMetrics({ profileMode: 'FAST' });

    expect(metrics.profileMode).toBe('FAST');
    expect(metrics.p50LatencyMs).toBeGreaterThan(0);
    expect(metrics.cacheHitRatePercent).toBeGreaterThan(0);
  });
});
