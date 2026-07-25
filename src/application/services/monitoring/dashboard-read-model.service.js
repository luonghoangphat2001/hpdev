'use strict';

class DashboardReadModelService {
  constructor({ dashboardRepository, metricsRegistry, productionEnabled = false }) {
    if (!dashboardRepository || typeof dashboardRepository.getOverview !== 'function') {
      throw new TypeError('Dashboard read model requires a dashboard repository');
    }
    this.dashboardRepository = dashboardRepository;
    this.metricsRegistry = metricsRegistry;
    this.productionEnabled = productionEnabled;
  }

  async getOverview() {
    const operationalCounts = await this.dashboardRepository.getOverview();
    const metrics = this.metricsRegistry?.snapshot
      ? this.metricsRegistry.snapshot()
      : {};

    return Object.freeze({
      service: 'openclaw-orchestrator',
      status: 'UP',
      productionEnabled: this.productionEnabled,
      operationalCounts,
      metrics,
      generatedAt: new Date().toISOString(),
    });
  }
}

module.exports = DashboardReadModelService;
