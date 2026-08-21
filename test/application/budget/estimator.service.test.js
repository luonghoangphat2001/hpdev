'use strict';

const CostEstimatorPolicy = require('../../../src/policy/budget/cost-estimator.policy');

describe('T182: Preflight Token/Cost/Latency Estimator Service', () => {
  test('estimates tokens, cost, latency, and gives preflight recommendation', () => {
    const service = new CostEstimatorPolicy({});
    const est = service.estimatePreflight({ taskDescription: 'Generate monthly report', executionProfile: 'STANDARD' });

    expect(est.estimatedTokens).toBeGreaterThan(0);
    expect(est.estimatedCostUSD).toBeGreaterThan(0);
    expect(est.recommendation).toBe('PROCEED');
  });
});
