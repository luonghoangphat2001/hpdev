'use strict';

class DeterministicRiskDecisionGateService {
  constructor({ riskEvaluator }) {
    this.riskEvaluator = riskEvaluator;
  }

  selectExecutionProfile({ taskType, amountUSD = 0, riskScore = 0 }) {
    let mode = 'STANDARD';
    if (riskScore > 0.8 || amountUSD > 5000) {
      mode = 'STRICT';
    } else if (riskScore < 0.2 && amountUSD < 100) {
      mode = 'FAST';
    }

    return Object.freeze({
      mode,
      llmCallUsed: false,
      decisionTrace: `Selected ${mode} based on riskScore=${riskScore}, amountUSD=${amountUSD}`,
      selectedAt: new Date().toISOString(),
    });
  }
}

module.exports = DeterministicRiskDecisionGateService;
