'use strict';

const ReadinessGateService = require('../../../src/services/ceo/exception/readiness-gate.service');

describe('T140: CEO Dashboard/OpenClaw Monitor Baseline Readiness Gate Service', () => {
  test('verifies all dashboard baseline readiness criteria', () => {
    const service = new ReadinessGateService();
    const res = service.verifyBaselineReadiness();

    expect(res.overallReadinessPassed).toBe(true);
    expect(res.dashboardCoreReady).toBe(true);
    expect(res.securityAuditReady).toBe(true);
  });
});
