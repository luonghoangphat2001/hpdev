/**
 * @fileoverview token-meter.policy - Provides token-meter functionality.
 */
'use strict';

const BasePolicy = require('../BasePolicy');

/**
 * TokenMeterPolicy
 * Manages token meter logic.
 */
class TokenMeterPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    super({ name: 'TokenMeterPolicy' });


    this.records = [];
  }

  /**
   * recordCost - Executes record cost.
   * @param {*} model - Input parameter.
   * @param {*} agent - Input parameter.
   * @param {*} workflowId - Input parameter.
   * @param {*} tool - Input parameter.
   * @param {*} tokensUsed - Input parameter.
   * @param {*} cost - Input parameter.
   * @returns {*} Result of operation.
   */
  recordCost({ model, agent, workflowId, tool, tokensUsed = 0, cost = 0 }) {
    const entry = Object.freeze({
      model,
      agent,
      workflowId,
      tool,
      tokensUsed,
      cost,
      timestamp: new Date().toISOString(),
    });
    this.records.push(entry);
    return entry;
  }

  /**
   * getTotalCostForAgent - Executes get total cost for agent.
   * @param {*} agent - Input parameter.
   * @returns {*} Result of operation.
   */
  getTotalCostForAgent(agent) {
    return this.records
      .filter(r => r.agent === agent)
      .reduce((sum, r) => sum + r.cost, 0);
  }
}

module.exports = TokenMeterPolicy;
