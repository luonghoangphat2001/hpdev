/**
 * @fileoverview critic-sampler.service - Provides critic-sampler functionality.
 */
'use strict';

/**
 * CriticSamplerService
 * Manages critic sampler logic.
 */
class CriticSamplerService {
  /**
   * evaluateSampling - Executes evaluate sampling.
   * @param {*} risk - Input parameter.
   * @param {*} samplingRatePercent - Input parameter.
   * @param {*} recentErrorRate - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = CriticSamplerService;
