/**
 * @fileoverview model-router.policy - Provides model-router functionality.
 */
'use strict';

const BasePolicy = require('../BasePolicy');

/**
 * ModelRouterPolicy
 * Manages model router logic.
 */
class ModelRouterPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} primaryModel - Input parameter.
   * @param {*} lowCostModel - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ primaryModel = 'gemini-3.6-flash', lowCostModel = 'gemini-1.5-flash' } = {}) {
    super({ name: 'ModelRouterPolicy' });


    this.primaryModel = primaryModel;
    this.lowCostModel = lowCostModel;
  }

  /**
   * selectModel - Executes select model.
   * @param {*} riskLevel - Input parameter.
   * @param {*} budgetStatus - Input parameter.
   * @returns {*} Result of operation.
   */
  selectModel({ riskLevel = 'LOW', budgetStatus = 'OK' }) {
    if (budgetStatus === 'WARNING' || (riskLevel === 'LOW' && budgetStatus === 'OK')) {
      return this.lowCostModel;
    }
    return this.primaryModel;
  }
}

module.exports = ModelRouterPolicy;
