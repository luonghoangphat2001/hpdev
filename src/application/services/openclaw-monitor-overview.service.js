'use strict';

class OpenclawMonitorOverviewService {
  constructor({ healthCheckService, metricsSloService }) {
    this.healthCheckService = healthCheckService;
    this.metricsSloService = metricsSloService;
  }

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

module.exports = OpenclawMonitorOverviewService;
