'use strict';

const DeterministicRiskDecisionGateService = require('../../../src/application/services/orchestration/deterministic-risk-decision-gate.service');

describe('T172: Deterministic Risk/Complexity Decision Gate Service', () => {
  test('selects profile deterministically without calling LLM', () => {
    const service = new DeterministicRiskDecisionGateService({});
    const fast = service.selectExecutionProfile({ taskType: 'READ', amountUSD: 10, riskScore: 0.1 });
    expect(fast.mode).toBe('FAST');
    expect(fast.llmCallUsed).toBe(false);

    const strict = service.selectExecutionProfile({ taskType: 'TRANSFER', amountUSD: 10000, riskScore: 0.9 });
    expect(strict.mode).toBe('STRICT');
    expect(strict.decisionTrace).toContain('Selected STRICT');
  });
});
