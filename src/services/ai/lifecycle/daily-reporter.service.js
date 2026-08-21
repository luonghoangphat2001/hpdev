/**
 * @fileoverview daily-reporter.service - Provides daily-reporter functionality.
 */
'use strict';

/**
 * DailyReporterService
 * Manages daily reporter logic.
 */
class DailyReporterService {
  /**
   * constructor - Executes constructor.
   * @param {*} agent - Input parameter.
   * @param {*} reportRepository - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ agent, reportRepository }) {
    this.agent = agent;
    this.reportRepository = reportRepository;
  }

  /**
   * report - Asynchronously executes report.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async report({ from, to }) {
    const metrics = await this.reportRepository.summarizeAgent(
      this.agent.id,
      from,
      to,
    );
    return Object.freeze({
      agentId: this.agent.id,
      department: this.agent.department,
      status: metrics.failedCount > 0 ? 'attention' : 'ok',
      metrics,
    });
  }
}

module.exports = DailyReporterService;
