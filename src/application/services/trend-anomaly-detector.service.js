'use strict';

class TrendAnomalyDetectorService {
  detectAnomaly({ currentValue, baselineValue, thresholdPercent = 20 }) {
    if (baselineValue === 0) {
      return Object.freeze({
        isAnomaly: false,
        variancePercent: 0,
        confidence: 0,
      });
    }

    const variancePercent = ((currentValue - baselineValue) / baselineValue) * 100;
    const isAnomaly = Math.abs(variancePercent) >= thresholdPercent;
    const confidence = Math.min(1.0, Math.abs(variancePercent) / (thresholdPercent * 2));

    return Object.freeze({
      currentValue,
      baselineValue,
      variancePercent,
      isAnomaly,
      confidence,
      detectedAt: new Date().toISOString(),
    });
  }
}

module.exports = TrendAnomalyDetectorService;
