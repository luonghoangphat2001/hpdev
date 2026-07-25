'use strict';

class LoadPerformanceSoakTestService {
  verifySloUnderLoad({ rps = 100, p95LatencyMs = 200, errorRatePercent = 0.01 }) {
    const meetsLatency = p95LatencyMs <= 500;
    const meetsErrorRate = errorRatePercent <= 0.1;

    return Object.freeze({
      passed: meetsLatency && meetsErrorRate,
      rps,
      p95LatencyMs,
      errorRatePercent,
      testedAt: new Date().toISOString(),
    });
  }
}

module.exports = LoadPerformanceSoakTestService;
