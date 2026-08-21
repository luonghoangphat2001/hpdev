/**
 * @fileoverview kpi-recommend.service - Provides kpi-recommend functionality.
 */
'use strict';

/**
 * KpiRecommendService
 * Manages kpi recommend logic.
 */
class KpiRecommendService {
  /**
   * recommendAction - Executes recommend action.
   * @param {*} kpiKey - Input parameter.
   * @param {*} currentValue - Input parameter.
   * @param {*} targetValue - Input parameter.
   * @param {*} isTargetMet - Input parameter.
   * @returns {*} Result of operation.
   */
  recommendAction({ kpiKey, currentValue, targetValue, isTargetMet }) {
    if (isTargetMet) {
      return Object.freeze({
        kpiKey,
        recommendationNeeded: false,
        proposedAction: null,
      });
    }

    const proposedAction = {
      action: `optimize_${kpiKey.replace('.', '_')}`,
      reason: `KPI ${kpiKey} current value (${currentValue}) missed target (${targetValue})`,
      riskLevel: 'MEDIUM',
      estimatedImpact: 'HIGH',
    };

    return Object.freeze({
      kpiKey,
      recommendationNeeded: true,
      proposedAction,
    });
  }
}

module.exports = KpiRecommendService;
