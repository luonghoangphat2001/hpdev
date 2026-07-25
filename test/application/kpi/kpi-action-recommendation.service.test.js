'use strict';

const KpiActionRecommendationService = require('../../../src/application/services/kpi/kpi-action-recommendation.service');

describe('T078: KPI-to-Action Recommendation Service', () => {
  test('generates recommendation when target is missed', () => {
    const service = new KpiActionRecommendationService();
    const result = service.recommendAction({
      kpiKey: 'ops.sla_compliance_rate',
      currentValue: 0.88,
      targetValue: 0.95,
      isTargetMet: false,
    });

    expect(result.recommendationNeeded).toBe(true);
    expect(result.proposedAction.riskLevel).toBe('MEDIUM');
  });

  test('no recommendation needed when target is met', () => {
    const service = new KpiActionRecommendationService();
    const result = service.recommendAction({
      kpiKey: 'ops.sla_compliance_rate',
      currentValue: 0.98,
      targetValue: 0.95,
      isTargetMet: true,
    });

    expect(result.recommendationNeeded).toBe(false);
    expect(result.proposedAction).toBeNull();
  });
});
