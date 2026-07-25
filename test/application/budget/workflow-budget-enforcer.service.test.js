'use strict';

const WorkflowBudgetEnforcerService = require('../../../src/application/services/budget/workflow-budget-enforcer.service');

describe('T181: Workflow Budget Enforcer Service', () => {
  test('enforces hard caps on LLM calls, tokens, cost, and steps', () => {
    const service = new WorkflowBudgetEnforcerService({});
    const normal = service.enforceBudget({ workflowId: 'wf_1', callsCount: 2, tokensCount: 1000, costUSD: 0.05, stepsCount: 3 });
    expect(normal.exceeded).toBe(false);

    const exceeded = service.enforceBudget({ workflowId: 'wf_1', callsCount: 15, tokensCount: 1000, costUSD: 0.05, stepsCount: 3 });
    expect(exceeded.exceeded).toBe(true);
    expect(exceeded.hardCapHit).toBe(true);
  });
});
