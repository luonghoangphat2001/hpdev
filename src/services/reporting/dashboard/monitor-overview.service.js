/**
 * @fileoverview monitor-overview.service - Provides monitor-overview functionality.
 */
'use strict';

/**
 * MonitorOverviewService
 * Manages monitor overview logic.
 */
class MonitorOverviewService {
  /**
   * constructor - Executes constructor.
   * @param {*} healthCheckService - Input parameter.
   * @param {*} metricsSloService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ healthCheckService, metricsSloService }) {
    this.healthCheckService = healthCheckService;
    this.metricsSloService = metricsSloService;
  }

  /**
   * getOverviewData - Asynchronously executes get overview data.
   * @returns {*} Promise resolving result.
   */
  async getOverviewData() {
    const health = this.healthCheckService ? await this.healthCheckService.checkReadiness() : { status: 'UP' };
    const metrics = this.metricsSloService ? await this.metricsSloService.getSloMetrics() : {};

    return Object.freeze({
      health,
      metrics,
      activeProviders: Object.freeze(['google', 'openai']),
      alertCount: 0,
      generatedAt: new Date().toISOString(),
    });
  }
}

module.exports = MonitorOverviewService;
