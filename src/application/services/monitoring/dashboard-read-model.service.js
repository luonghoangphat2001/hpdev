'use strict';

class DashboardReadModelService {
  constructor({
    dashboardRepository,
    metricsRegistry,
    agentRegistry = null,
    productionEnabled = false,
  }) {
    if (!dashboardRepository || typeof dashboardRepository.getOverview !== 'function') {
      throw new TypeError('Dashboard read model requires a dashboard repository');
    }
    this.dashboardRepository = dashboardRepository;
    this.metricsRegistry = metricsRegistry;
    this.agentRegistry = agentRegistry;
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

  async getAgents() {
    if (!this.agentRegistry || typeof this.agentRegistry.list !== 'function') {
      throw new TypeError('Dashboard agent read model requires an agent registry');
    }
    const profiles = this.agentRegistry.list();
    const summaries = await this.dashboardRepository.getAgentSummaries(
      profiles.map((profile) => profile.id),
    );
    const summaryByAgent = new Map(summaries.map((summary) => [summary.agentId, summary]));

    return Object.freeze(profiles.map((profile) => {
      const summary = summaryByAgent.get(profile.id) || {};
      const activeWorkflowCount = summary.activeWorkflowCount || 0;
      return Object.freeze({
        agentId: profile.id,
        department: profile.department,
        mission: profile.mission,
        version: profile.version,
        capabilities: profile.capabilities,
        permissions: profile.permissions,
        activityStatus: activeWorkflowCount > 0 ? 'BUSY' : 'IDLE',
        lifecycleStatus: 'NOT_PERSISTED',
        workflowCount: summary.workflowCount || 0,
        activeWorkflowCount,
        failedWorkflowCount: summary.failedWorkflowCount || 0,
        lastActivityAt: summary.lastActivityAt || null,
      });
    }));
  }
}

module.exports = DashboardReadModelService;
