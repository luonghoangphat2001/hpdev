'use strict';

class CostAwareModelRouterService {
  constructor({ primaryModel = 'gemini-3.6-flash', lowCostModel = 'gemini-1.5-flash' } = {}) {
    this.primaryModel = primaryModel;
    this.lowCostModel = lowCostModel;
  }

  selectModel({ riskLevel = 'LOW', budgetStatus = 'OK' }) {
    if (budgetStatus === 'WARNING' || (riskLevel === 'LOW' && budgetStatus === 'OK')) {
      return this.lowCostModel;
    }
    return this.primaryModel;
  }
}

module.exports = CostAwareModelRouterService;
