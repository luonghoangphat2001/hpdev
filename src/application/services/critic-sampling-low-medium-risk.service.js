'use strict';

class CriticSamplingLowMediumRiskService {
  evaluateSampling({ risk = 'LOW', samplingRatePercent = 20, recentErrorRate = 0.01 }) {
    let effectiveRate = samplingRatePercent;
    if (recentErrorRate > 0.05) {
      effectiveRate = Math.min(100, samplingRatePercent * 2);
    }

    const sampled = Math.random() * 100 < effectiveRate;

    return Object.freeze({
      risk,
      samplingRatePercent,
      recentErrorRate,
      effectiveRate,
      sampled,
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = CriticSamplingLowMediumRiskService;
