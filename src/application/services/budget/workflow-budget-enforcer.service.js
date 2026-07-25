'use strict';

class WorkflowBudgetEnforcerService {
  constructor({ budgetPolicyService }) {
    this.budgetPolicyService = budgetPolicyService;
  }

  enforceBudget({ workflowId, callsCount, tokensCount, costUSD, stepsCount }) {
    const limits = { maxCalls: 10, maxTokens: 50000, maxCostUSD: 1.0, maxSteps: 20 };

    if (callsCount > limits.maxCalls || tokensCount > limits.maxTokens || costUSD > limits.maxCostUSD || stepsCount > limits.maxSteps) {
      return Object.freeze({
        workflowId,
        exceeded: true,
        hardCapHit: true,
        reason: 'Hard cap exceeded for LLM calls/tokens/cost/steps',
        enforcedAt: new Date().toISOString(),
      });
    }

    return Object.freeze({
      workflowId,
      exceeded: false,
      hardCapHit: false,
      enforcedAt: new Date().toISOString(),
    });
  }
}

module.exports = WorkflowBudgetEnforcerService;
