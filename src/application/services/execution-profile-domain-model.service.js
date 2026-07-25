'use strict';

class ExecutionProfileDomainModelService {
  createExecutionProfile({ mode = 'STANDARD', reason = 'Default workflow policy', tokenBudget = 10000, callBudget = 5 }) {
    return Object.freeze({
      profileId: `profile_${Math.random().toString(36).substr(2, 9)}`,
      mode, // FAST, STANDARD, STRICT
      reason,
      budgets: Object.freeze({ tokenBudget, callBudget }),
      actualUsage: Object.freeze({ tokensUsed: 0, callsUsed: 0 }),
      outcome: 'INITIALIZED',
      createdAt: new Date().toISOString(),
    });
  }
}

module.exports = ExecutionProfileDomainModelService;
