'use strict';

const CriticSamplingLowMediumRiskService = require('../../../src/application/services/intelligence/critic-sampling-low-medium-risk.service');

describe('T177: Critic Sampling for LOW/MEDIUM RISK Service', () => {
  test('evaluates sampling rate and auto-increases rate when error rate spikes', () => {
    const service = new CriticSamplingLowMediumRiskService();
    const normal = service.evaluateSampling({ risk: 'LOW', samplingRatePercent: 20, recentErrorRate: 0.01 });
    expect(normal.effectiveRate).toBe(20);

    const errorSpike = service.evaluateSampling({ risk: 'LOW', samplingRatePercent: 20, recentErrorRate: 0.08 });
    expect(errorSpike.effectiveRate).toBe(40);
  });
});
