'use strict';

class KpiActionRecommendationService {
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

module.exports = KpiActionRecommendationService;
