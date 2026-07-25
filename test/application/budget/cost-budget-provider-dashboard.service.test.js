'use strict';

const CostBudgetProviderDashboardService = require('../../../src/application/services/budget/cost-budget-provider-dashboard.service');

describe('T134: Cost, Budget, and Provider Dashboard Service', () => {
  test('returns cost, budget cap, and provider breakdown', async () => {
    const service = new CostBudgetProviderDashboardService({});
    const data = await service.getCostDashboardData();

    expect(data.totalCostUSD).toBeLessThanOrEqual(data.budgetCapUSD);
    expect(data.activeProvider).toBe('google');
    expect(data.costByAgent.dan_cfo).toBeDefined();
  });
});
