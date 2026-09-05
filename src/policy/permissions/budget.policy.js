/**
 * @fileoverview budget.policy - Provides budget-policy functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * BudgetPolicy
 * Manages budget policy logic.
 */
class BudgetPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} dailyCostCap - Input parameter.
   * @param {*} monthlyCostCap - Input parameter.
   * @param {*} warningThresholdPercent - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ dailyCostCap = 10.0, monthlyCostCap = 300.0, warningThresholdPercent = 80 } = {}) {
    super({ name: 'BudgetPolicy' });


    this.dailyCostCap = dailyCostCap;
    this.monthlyCostCap = monthlyCostCap;
    this.warningThresholdPercent = warningThresholdPercent;
  }

  /**
   * evaluateBudget - Executes evaluate budget.
   * @param {*} currentDailyCost - Input parameter.
   * @param {*} currentMonthlyCost - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = BudgetPolicy;
