'use strict';

const CostAwareModelRouterService = require('../../../src/application/services/budget/cost-aware-model-router.service');

describe('T091: Cost-Aware Model Router Service', () => {
  test('routes to low cost model under budget warning or low risk', () => {
    const router = new CostAwareModelRouterService({ primaryModel: 'flash-3.6', lowCostModel: 'flash-1.5' });

    expect(router.selectModel({ riskLevel: 'LOW', budgetStatus: 'OK' })).toBe('flash-1.5');
    expect(router.selectModel({ riskLevel: 'HIGH', budgetStatus: 'WARNING' })).toBe('flash-1.5');
    expect(router.selectModel({ riskLevel: 'HIGH', budgetStatus: 'OK' })).toBe('flash-3.6');
  });
});
