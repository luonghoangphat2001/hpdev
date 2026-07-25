'use strict';

class BudgetPolicyService {
  constructor({ dailyCostCap = 10.0, monthlyCostCap = 300.0, warningThresholdPercent = 80 } = {}) {
    this.dailyCostCap = dailyCostCap;
    this.monthlyCostCap = monthlyCostCap;
    this.warningThresholdPercent = warningThresholdPercent;
  }

  evaluateBudget({ currentDailyCost = 0, currentMonthlyCost = 0 }) {
    const dailyRatio = (currentDailyCost / this.dailyCostCap) * 100;
    const monthlyRatio = (currentMonthlyCost / this.monthlyCostCap) * 100;

    if (currentDailyCost >= this.dailyCostCap || currentMonthlyCost >= this.monthlyCostCap) {
      return Object.freeze({ status: 'HARD_STOP', reason: 'Budget limit exceeded' });
    }

    if (dailyRatio >= this.warningThresholdPercent || monthlyRatio >= this.warningThresholdPercent) {
      return Object.freeze({ status: 'WARNING', reason: 'Approaching budget limit' });
    }

    return Object.freeze({ status: 'OK', reason: null });
  }
}

module.exports = BudgetPolicyService;
