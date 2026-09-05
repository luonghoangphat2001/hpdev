'use strict';

const BudgetPolicy = require('@policy/permissions/budget.policy');

describe('T090: Budget Policy Service', () => {
  test('evaluates budget limits correctly', () => {
    const service = new BudgetPolicy({ dailyCostCap: 10, warningThresholdPercent: 80 });

    expect(service.evaluateBudget({ currentDailyCost: 5 }).status).toBe('OK');
    expect(service.evaluateBudget({ currentDailyCost: 8.5 }).status).toBe('WARNING');
    expect(service.evaluateBudget({ currentDailyCost: 10.5 }).status).toBe('HARD_STOP');
  });
});
