'use strict';

const OpenclawMonitorOverviewService = require('../../src/application/services/openclaw-monitor-overview.service');

describe('T124: OpenClaw Monitor Overview Page Service', () => {
  test('aggregates overview metrics and health info', async () => {
    const mockHealth = { checkReadiness: jest.fn().mockResolvedValue({ status: 'UP' }) };
    const mockMetrics = { getSloMetrics: jest.fn().mockResolvedValue({ throughputReqPerSec: 10 }) };

    const service = new OpenclawMonitorOverviewService({ healthCheckService: mockHealth, metricsSloService: mockMetrics });
    const overview = await service.getOverviewData();

    expect(overview.health.status).toBe('UP');
    expect(overview.metrics.throughputReqPerSec).toBe(10);
  });
});
