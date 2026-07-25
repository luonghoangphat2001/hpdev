'use strict';

class TokenToolCostMeterService {
  constructor() {
    this.records = [];
  }

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

  getTotalCostForAgent(agent) {
    return this.records
      .filter(r => r.agent === agent)
      .reduce((sum, r) => sum + r.cost, 0);
  }
}

module.exports = TokenToolCostMeterService;
