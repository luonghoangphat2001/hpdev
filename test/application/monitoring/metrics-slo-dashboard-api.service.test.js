'use strict';

const MetricsSloDashboardApiService = require('../../../src/application/services/monitoring/metrics-slo-dashboard-api.service');

describe('T108: Metrics/SLO Dashboard API Service', () => {
  test('returns SLO metrics overview', async () => {
    const service = new MetricsSloDashboardApiService();
    const metrics = await service.getSloMetrics();

    expect(metrics.throughputReqPerSec).toBeDefined();
    expect(metrics.errorRatePercent).toBeLessThan(1);
    expect(metrics.p95LatencyMs).toBeLessThan(500);
  });
});
