'use strict';

const CeoStrategyReportService = require('../../src/application/services/ceo-strategy-report.service');

describe('T106: CEO Strategy Report Service', () => {
  test('generates comprehensive strategic report for CEO', () => {
    const service = new CeoStrategyReportService();
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
