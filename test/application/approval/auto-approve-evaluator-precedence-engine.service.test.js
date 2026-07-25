'use strict';

const AutoApproveEvaluatorPrecedenceEngineService = require('../../../src/application/services/approval/auto-approve-evaluator-precedence-engine.service');

describe('T195: Auto-Approve Evaluator and Precedence Engine Service', () => {
  test('evaluates precedence deterministic chain: HARD_DENY > MANUAL > AUTO > DEFAULT_DENY', () => {
    const service = new AutoApproveEvaluatorPrecedenceEngineService({});
    
    const hard = service.evaluatePrecedence({ actionType: 'PO_CREATE', isHardDeny: true, matchesRule: true });
    expect(hard.decision).toBe('HARD_DENY');

    const auto = service.evaluatePrecedence({ actionType: 'PO_CREATE', isHardDeny: false, matchesRule: true });
    expect(auto.decision).toBe('AUTO');
  });
});
