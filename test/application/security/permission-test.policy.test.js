'use strict';

const PermissionTestPolicy = require('../../../src/policy/permissions/permission-test.policy');

describe('T150: Permission/Isolation/Race/Security Test Service', () => {
  test('verifies privilege escalation and cross-agent isolation tests pass', () => {
    const service = new PermissionTestPolicy();
    const res = service.runIsolationSecuritySuite();

    expect(res.privilegeEscalationShieldPassed).toBe(true);
    expect(res.crossAgentIsolationPassed).toBe(true);
  });
});
