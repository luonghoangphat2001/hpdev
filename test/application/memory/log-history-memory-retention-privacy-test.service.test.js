'use strict';

const LogHistoryMemoryRetentionPrivacyTestService = require('../../../src/application/services/memory/log-history-memory-retention-privacy-test.service');

describe('T169: Log/History/Memory Retention, Privacy, and Load Tests Service', () => {
  test('verifies PII redaction, retention, replay, and cross-agent isolation tests pass', () => {
    const service = new LogHistoryMemoryRetentionPrivacyTestService({});
    const res = service.runRetentionPrivacyTestSuite();

    expect(res.piiRedactionPassed).toBe(true);
    expect(res.retentionPolicyEnforced).toBe(true);
    expect(res.crossAgentIsolationPassed).toBe(true);
  });
});
