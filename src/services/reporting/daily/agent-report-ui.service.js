/**
 * @fileoverview agent-report-ui.service - Provides agent-report-ui functionality.
 */
'use strict';

/**
 * AgentReportUiService
 * Manages agent report ui logic.
 */
class AgentReportUiService {
  /**
   * constructor - Executes constructor.
   * @param {*} ceoStrategyReportService - Input parameter.
   * @param {*} ceoWeeklyReviewService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ ceoStrategyReportService, ceoWeeklyReviewService }) {
    this.ceoStrategyReportService = ceoStrategyReportService;
    this.ceoWeeklyReviewService = ceoWeeklyReviewService;
  }

  /**
   * getReportCenterOverview - Asynchronously executes get report center overview.
   * @returns {*} Promise resolving result.
   */
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

module.exports = AgentReportUiService;
