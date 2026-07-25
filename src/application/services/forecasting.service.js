'use strict';

class ForecastingService {
  forecastDemand({ historicalValues = [], horizonDays = 7 }) {
    if (historicalValues.length === 0) {
      return Object.freeze({ forecast: [], confidence: 0, errorMetric: 'NO_DATA' });
    }

    const sum = historicalValues.reduce((a, b) => a + b, 0);
    const avg = sum / historicalValues.length;
    const forecast = Array.from({ length: horizonDays }, () => Math.round(avg * 100) / 100);

    return Object.freeze({
      historicalValues,
      horizonDays,
      forecast,
      confidence: Math.min(0.9, historicalValues.length / 30),
      errorMetric: 'MAE_SIMPLE_AVERAGE',
    });
  }
}

module.exports = ForecastingService;
