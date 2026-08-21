'use strict';

const BudgetDashboardPolicy = require('../../../src/policy/budget/budget-dashboard.policy');

describe('T134: Cost, Budget, and Provider Dashboard Service', () => {
  test('returns cost, budget cap, and provider breakdown', async () => {
    const service = new BudgetDashboardPolicy({});
    const data = await service.getCostDashboardData();

    expect(data.totalCostUSD).toBeLessThanOrEqual(data.budgetCapUSD);
    expect(data.activeProvider).toBe('google');
    expect(data.costByAgent.dan_cfo).toBeDefined();
  });
});
