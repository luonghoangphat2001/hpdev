/**
 * @fileoverview report-aggregator.service - Provides report-aggregator functionality.
 */
'use strict';

/**
 * ReportAggregatorService
 * Manages report aggregator logic.
 */
class ReportAggregatorService {
  constructor({
    reporters,
    notificationGateway,
    timeoutMs = 5000,
  }) {
    this.reporters = reporters;
    this.notificationGateway = notificationGateway;
    this.timeoutMs = timeoutMs;
  }

  /**
   * aggregateAndNotify - Asynchronously executes aggregate and notify.
   * @param {*} reportDate - Input parameter.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async aggregateAndNotify({ reportDate, from, to }) {
    const reports = await Promise.all(this.reporters.map(
      (reporter) => this.#collect(reporter, { from, to })
    ));
    const degraded = reports.filter(({ status }) => status === 'degraded').length;
    const attention = reports.filter(({ status }) => status === 'attention').length;
    const message = this.#format(reportDate, reports);

    const receipt = await this.notificationGateway.notify({
      idempotencyKey: `daily-agent-report:${reportDate}`,
      title: `Báo cáo ngày của 5 AI Đần — ${reportDate}`,
      message,
      severity: degraded > 0 || attention > 0 ? 'warning' : 'success',
    });

    return Object.freeze({ reportDate, reports: Object.freeze(reports), receipt });
  }

  async #collect(reporter, period) {
    try {
      return await this.#withTimeout(
        reporter.report(period),
        reporter.agent.id,
      );
    } catch (error) {
      return Object.freeze({
        agentId: reporter.agent.id,
        department: reporter.agent.department,
        status: 'degraded',
        errorCode: error.code || 'daily_report_failed',
      });
    }
  }

  #withTimeout(promise, agentId) {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`Daily report timed out for ${agentId}`);
        error.code = 'daily_report_timeout';
        reject(error);
      }, this.timeoutMs);
    });
    return Promise.race([Promise.resolve(promise), timeout])
      .finally(() => clearTimeout(timer));
  }

  #format(reportDate, reports) {
    const lines = [`Ngày dữ liệu: **${reportDate}**`, ''];
    reports.forEach((report) => {
      if (report.status === 'degraded') {
        lines.push(`⚠️ **${report.agentId}**: chưa lấy được báo cáo (${report.errorCode})`);
        return;
      }
      const icon = report.status === 'attention' ? '⚠️' : '✅';
      const metrics = report.metrics;
      lines.push(
        `${icon} **${report.agentId}**: ${metrics.workflowCount} workflow · `
        + `${metrics.completedCount} xong · ${metrics.failedCount} lỗi · `
        + `${metrics.awaitingApprovalCount} chờ duyệt · ${metrics.actionCount} action`
      );
    });
    return lines.join('\n');
  }
}

module.exports = ReportAggregatorService;
