'use strict';

const CriticSamplerService = require('@services/ai/critics/critic-sampler.service');

describe('T177: Critic Sampling for LOW/MEDIUM RISK Service', () => {
  test('evaluates sampling rate and auto-increases rate when error rate spikes', () => {
    const service = new CriticSamplerService();
    const normal = service.evaluateSampling({ risk: 'LOW', samplingRatePercent: 20, recentErrorRate: 0.01 });
    expect(normal.effectiveRate).toBe(20);

    const errorSpike = service.evaluateSampling({ risk: 'LOW', samplingRatePercent: 20, recentErrorRate: 0.08 });
    expect(errorSpike.effectiveRate).toBe(40);
  });
});
