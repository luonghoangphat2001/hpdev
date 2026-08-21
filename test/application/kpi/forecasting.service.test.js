'use strict';

const ForecastingService = require('../../../src/services/reporting/kpi/forecasting.service');

describe('T077: Forecasting Service', () => {
  test('generates simple baseline demand forecast', () => {
    const service = new ForecastingService();
    const result = service.forecastDemand({
      historicalValues: [100, 110, 90, 100],
      horizonDays: 3,
    });

    expect(result.forecast.length).toBe(3);
    expect(result.forecast[0]).toBe(100);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
