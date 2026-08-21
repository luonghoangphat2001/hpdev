'use strict';

const StrategyReportService = require('../../../src/services/ceo/daily/strategy-report.service');

describe('T106: CEO Strategy Report Service', () => {
  test('generates comprehensive strategic report for CEO', () => {
    const service = new StrategyReportService();
    const report = service.generateReport({
      opportunities: ['Expand Matcha line'],
      risks: ['Supplier price hike'],
      scenarios: ['Optimistic +20% sales'],
    });

    expect(report.reportType).toBe('WEEKLY_STRATEGY');
    expect(report.opportunities).toContain('Expand Matcha line');
    expect(report.risks).toContain('Supplier price hike');
  });
});
