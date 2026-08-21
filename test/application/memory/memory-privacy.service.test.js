'use strict';

const MemoryPrivacyService = require('../../../src/services/ai/memory/memory-privacy.service');

describe('T169: Log/History/Memory Retention, Privacy, and Load Tests Service', () => {
  test('verifies PII redaction, retention, replay, and cross-agent isolation tests pass', () => {
    const service = new MemoryPrivacyService({});
    const res = service.runRetentionPrivacyTestSuite();

    expect(res.piiRedactionPassed).toBe(true);
    expect(res.retentionPolicyEnforced).toBe(true);
    expect(res.crossAgentIsolationPassed).toBe(true);
  });
});
