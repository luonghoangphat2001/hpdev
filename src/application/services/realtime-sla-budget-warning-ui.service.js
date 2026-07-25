'use strict';

class RealtimeSlaBudgetWarningUiService {
  constructor({ workflowSlaPolicyRegistry }) {
    this.workflowSlaPolicyRegistry = workflowSlaPolicyRegistry;
  }

  getRealtimeSlaWarning({ workflowId, workflowType, elapsedTimeMs = 0, tokensUsed = 0, costUSD = 0 }) {
    const policy = {
      maxTimeoutMs: 10000,
      maxTokenBudget: 40000,
      maxCostUSD: 0.5,
    };

    const timePercent = Math.round((elapsedTimeMs / policy.maxTimeoutMs) * 100);
    const tokenPercent = Math.round((tokensUsed / policy.maxTokenBudget) * 100);
    const costPercent = Math.round((costUSD / policy.maxCostUSD) * 100);

    const isWarning = timePercent >= 70 || tokenPercent >= 70 || costPercent >= 70;

    return Object.freeze({
      workflowId,
      workflowType,
      timeWarningPercent: timePercent,
      tokenWarningPercent: tokenPercent,
      costWarningPercent: costPercent,
      isWarning,
      stageBottleneckDetected: isWarning,
      escalationRequired: timePercent >= 90 || costPercent >= 90,
      retrievedAt: new Date().toISOString(),
    });
  }
}

module.exports = RealtimeSlaBudgetWarningUiService;
