/**
 * @fileoverview sla-warning.service - Provides sla-warning functionality.
 */
'use strict';

/**
 * SlaWarningService
 * Manages sla warning logic.
 */
class SlaWarningService {
  /**
   * constructor - Executes constructor.
   * @param {*} workflowSlaPolicyRegistry - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ workflowSlaPolicyRegistry }) {
    this.workflowSlaPolicyRegistry = workflowSlaPolicyRegistry;
  }

  /**
   * getRealtimeSlaWarning - Executes get realtime sla warning.
   * @param {*} workflowId - Input parameter.
   * @param {*} workflowType - Input parameter.
   * @param {*} elapsedTimeMs - Input parameter.
   * @param {*} tokensUsed - Input parameter.
   * @param {*} costUSD - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = SlaWarningService;
