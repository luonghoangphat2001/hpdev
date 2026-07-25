'use strict';

class CeoStrategyReportService {
  generateReport({ opportunities = [], risks = [], scenarios = [] }) {
    return Object.freeze({
      opportunities: Object.freeze([...opportunities]),
      risks: Object.freeze([...risks]),
      strategicScenarios: Object.freeze([...scenarios]),
      reportType: 'WEEKLY_STRATEGY',
      generatedAt: new Date().toISOString(),
    });
  }
}

module.exports = CeoStrategyReportService;
