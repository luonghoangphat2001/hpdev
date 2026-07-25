'use strict';

const SecurityFailureInjectionTestService = require('../../src/application/services/security-failure-injection-test.service');

describe('T116: Security, Abuse and Failure-Injection Test Service', () => {
  test('passes security and failure injection verification', () => {
    const suite = new SecurityFailureInjectionTestService();
    const res = suite.runSecuritySuite();

    expect(res.replayAttackPassed).toBe(true);
    expect(res.promptInjectionShieldPassed).toBe(true);
    expect(res.dataLeakageShieldPassed).toBe(true);
  });
});
