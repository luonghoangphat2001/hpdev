'use strict';

const HealthCheckService = require('../../src/application/services/health-check.service');

describe('T107: Health/Readiness/Liveness Endpoints Service', () => {
  test('returns UP for liveness and reflects degraded state on readiness check', async () => {
    const mockDb = { ping: jest.fn().mockResolvedValue(true) };
    const mockSsot = { ping: jest.fn().mockRejectedValue(new Error('SSOT unreachable')) };

    const service = new HealthCheckService({ databaseClient: mockDb, ssotClient: mockSsot });
    const live = await service.checkLiveness();
    const ready = await service.checkReadiness();

    expect(live.status).toBe('UP');
    expect(ready.status).toBe('DEGRADED');
    expect(ready.dependencies.ssot).toBe('DEGRADED');
  });
});
