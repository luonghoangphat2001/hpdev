'use strict';

class FiveAgentReportCenterUiService {
  constructor({ ceoStrategyReportService, ceoWeeklyReviewService }) {
    this.ceoStrategyReportService = ceoStrategyReportService;
    this.ceoWeeklyReviewService = ceoWeeklyReviewService;
  }

  async getReportCenterOverview() {
    return Object.freeze({
      reportsAvailable: Object.freeze([
        { type: 'DAILY_BRIEF', agent: 'ALL', title: '5 Agent Daily Operational Brief' },
        { type: 'WEEKLY_REVIEW', agent: 'ALL', title: '5 Agent Weekly Executive Review' },
        { type: 'STRATEGY_REPORT', agent: 'CEO', title: 'CEO Quarterly Growth Strategy' },
      ]),
      deepLinkBase: '/dashboard/reports',
      retrievedAt: new Date().toISOString(),
    });
  }
}

module.exports = FiveAgentReportCenterUiService;
