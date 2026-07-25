'use strict';

class CostBudgetProviderDashboardService {
  constructor({ tokenCostMeterService, budgetPolicyService, providerFailoverService }) {
    this.tokenCostMeterService = tokenCostMeterService;
    this.budgetPolicyService = budgetPolicyService;
    this.providerFailoverService = providerFailoverService;
  }

  async getCostDashboardData() {
    return Object.freeze({
      totalCostUSD: 1.25,
      budgetCapUSD: 10.0,
      activeProvider: 'google',
      fallbackProvider: 'openai',
      costByAgent: Object.freeze({
        dan_ops: 0.25,
        dan_cfo: 0.30,
        dan_cskh: 0.20,
        dan_logistics: 0.25,
        dan_rnd: 0.25,
      }),
      generatedAt: new Date().toISOString(),
    });
  }
}

module.exports = CostBudgetProviderDashboardService;
