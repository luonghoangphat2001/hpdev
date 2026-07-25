'use strict';

const AdaptiveOptimizationReleaseGateService = require('../../src/application/services/adaptive-optimization-release-gate.service');

describe('T190: Adaptive Optimization Release Gate Service', () => {
  test('evaluates release gate ensuring profiles are ready for canary with rollback support', () => {
    const service = new AdaptiveOptimizationReleaseGateService({});
    const gate = service.evaluateReleaseGate();

    expect(gate.releaseGatePassed).toBe(true);
    expect(gate.profilesReady).toContain('STRICT');
    expect(gate.profileRollbackSupported).toBe(true);
  });
});
