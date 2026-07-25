'use strict';

const TrendAnomalyDetectorService = require('../../src/application/services/trend-anomaly-detector.service');

describe('T076: Trend Anomaly Detector Service', () => {
  test('detects anomaly when variance exceeds threshold', () => {
    const detector = new TrendAnomalyDetectorService();
    const result = detector.detectAnomaly({
      currentValue: 150,
      baselineValue: 100,
      thresholdPercent: 20,
    });

    expect(result.isAnomaly).toBe(true);
    expect(result.variancePercent).toBe(50);
  });

  test('normal metric is not flagged as anomaly', () => {
    const detector = new TrendAnomalyDetectorService();
    const result = detector.detectAnomaly({
      currentValue: 105,
      baselineValue: 100,
      thresholdPercent: 20,
    });

    expect(result.isAnomaly).toBe(false);
  });
});
