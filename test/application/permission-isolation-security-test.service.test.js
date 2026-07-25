'use strict';

const PermissionIsolationSecurityTestService = require('../../src/application/services/permission-isolation-security-test.service');

describe('T150: Permission/Isolation/Race/Security Test Service', () => {
  test('verifies privilege escalation and cross-agent isolation tests pass', () => {
    const service = new PermissionIsolationSecurityTestService();
    const res = service.runIsolationSecuritySuite();

    expect(res.privilegeEscalationShieldPassed).toBe(true);
    expect(res.crossAgentIsolationPassed).toBe(true);
  });
});
