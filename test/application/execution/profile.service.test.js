'use strict';

const ExecutionProfileService = require('../../../src/services/workflow/action/execution-profile.service');

describe('T171: ExecutionProfile Domain Model Service', () => {
  test('creates ExecutionProfile with FAST/STANDARD/STRICT mode and budgets', () => {
    const service = new ExecutionProfileService();
    const profile = service.createExecutionProfile({ mode: 'STRICT', reason: 'High financial risk', tokenBudget: 25000 });

    expect(profile.mode).toBe('STRICT');
    expect(profile.budgets.tokenBudget).toBe(25000);
    expect(profile.actualUsage.tokensUsed).toBe(0);
  });
});
