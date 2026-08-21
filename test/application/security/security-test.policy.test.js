'use strict';

const SecurityTestPolicy = require('../../../src/policy/permissions/security-test.policy');

describe('T116: Security, Abuse and Failure-Injection Test Service', () => {
  test('passes security and failure injection verification', () => {
    const suite = new SecurityTestPolicy();
    const res = suite.runSecuritySuite();

    expect(res.replayAttackPassed).toBe(true);
    expect(res.promptInjectionShieldPassed).toBe(true);
    expect(res.dataLeakageShieldPassed).toBe(true);
  });
});
