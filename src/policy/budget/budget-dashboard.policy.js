/**
 * @fileoverview budget-dashboard.policy - Provides budget-dashboard functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * BudgetDashboardPolicy
 * Manages budget dashboard logic.
 */
class BudgetDashboardPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} tokenCostMeterService - Input parameter.
   * @param {*} budgetPolicyService - Input parameter.
   * @param {*} providerFailoverService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ tokenCostMeterService, budgetPolicyService, providerFailoverService }) {
    super({ name: 'BudgetDashboardPolicy' });


    this.tokenCostMeterService = tokenCostMeterService;
    this.budgetPolicyService = budgetPolicyService;
    this.providerFailoverService = providerFailoverService;
  }

  /**
   * getCostDashboardData - Asynchronously executes get cost dashboard data.
   * @returns {*} Promise resolving result.
   */
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

module.exports = BudgetDashboardPolicy;
