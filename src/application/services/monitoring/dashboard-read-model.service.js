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
        lifecycleStatus: summary.lifecycleStatus || 'UNKNOWN',
        stateVersion: summary.stateVersion || null,
        lifecycleReason: summary.lifecycleReason || null,
        lifecycleChangedBy: summary.changedBy || null,
        lifecycleChangedAt: summary.changedAt || null,
        workflowCount: summary.workflowCount || 0,
        activeWorkflowCount,
        failedWorkflowCount: summary.failedWorkflowCount || 0,
        lastActivityAt: summary.lastActivityAt || null,
      });
    }));
  }

  async getWorkflows(query = {}) {
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const offset = Math.max(Number(query.offset) || 0, 0);
    const result = await this.dashboardRepository.listWorkflows({
      limit,
      offset,
      agentId: query.agentId || null,
      state: query.state || null,
      search: query.search?.trim() || null,
    });
    return Object.freeze({
      total: result.total,
      limit,
      offset,
      workflows: Object.freeze(result.rows.map((row) => Object.freeze({
        workflowId: row.workflow_id,
        correlationId: row.correlation_id,
        workflowType: row.workflow_type,
        state: row.state,
        stateVersion: Number(row.state_version),
        assignedAgentId: row.assigned_agent_id,
        riskLevel: row.risk_level,
        priority: Number(row.priority),
        failureCode: row.failure_code || null,
        failureReason: row.failure_reason || null,
        deadlineAt: row.deadline_at || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at || null,
      }))),
    });
  }
}

module.exports = DashboardReadModelService;
