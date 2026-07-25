'use strict';

const PreflightTokenCostLatencyEstimatorService = require('../../src/application/services/preflight-token-cost-latency-estimator.service');

describe('T182: Preflight Token/Cost/Latency Estimator Service', () => {
  test('estimates tokens, cost, latency, and gives preflight recommendation', () => {
    const service = new PreflightTokenCostLatencyEstimatorService({});
    const est = service.estimatePreflight({ taskDescription: 'Generate monthly report', executionProfile: 'STANDARD' });

    expect(est.estimatedTokens).toBeGreaterThan(0);
    expect(est.estimatedCostUSD).toBeGreaterThan(0);
    expect(est.recommendation).toBe('PROCEED');
  });
});
