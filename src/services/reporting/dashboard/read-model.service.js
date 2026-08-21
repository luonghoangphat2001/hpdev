/**
 * @fileoverview read-model.service - Provides read-model functionality.
 */
'use strict';

/**
 * ReadModelService
 * Manages read model logic.
 */
class ReadModelService {
  constructor({
    dashboardRepository,
    metricsRegistry,
    agentRegistry = null,
    productionEnabled = false,
    ssotClient = null,
    companyDashboardUrl = null,
  }) {
    if (!dashboardRepository || typeof dashboardRepository.getOverview !== 'function') {
      throw new TypeError('Dashboard read model requires a dashboard repository');
    }
    this.dashboardRepository = dashboardRepository;
    this.metricsRegistry = metricsRegistry;
    this.agentRegistry = agentRegistry;
    this.productionEnabled = productionEnabled;
    this.ssotClient = ssotClient;
    this.companyDashboardUrl = companyDashboardUrl;
  }

  /**
   * getOverview - Asynchronously executes get overview.
   * @returns {*} Promise resolving result.
   */
  async getOverview() {
    const [operationalCounts, companyDashboard] = await Promise.all([
      this.dashboardRepository.getOverview(),
      this.#getCompanyDashboardStatus(),
    ]);
    const metrics = this.metricsRegistry?.snapshot
      ? this.metricsRegistry.snapshot()
      : {};

    return Object.freeze({
      service: 'openclaw-orchestrator',
      status: 'UP',
      productionEnabled: this.productionEnabled,
      operationalCounts,
      companyDashboard,
      metrics,
      generatedAt: new Date().toISOString(),
    });
  }

  async #getCompanyDashboardStatus() {
    if (!this.ssotClient || typeof this.ssotClient.ping !== 'function') {
      return Object.freeze({
        status: 'NOT_CONFIGURED',
        baseUrl: this.companyDashboardUrl,
      });
    }

    try {
      const response = await this.ssotClient.ping({ timeoutMs: 5000 });
      return Object.freeze({
        status: response?.integration?.status || 'UP',
        baseUrl: this.companyDashboardUrl,
        apiVersion: response?.integration?.api_version || 'v1',
        agent: response?.integration?.agent || null,
        operationalSummary: response?.integration?.operational_summary || {},
        checkedAt: response?.integration?.checked_at || new Date().toISOString(),
      });
    } catch (error) {
      return Object.freeze({
        status: 'DEGRADED',
        baseUrl: this.companyDashboardUrl,
        errorCode: error.code || 'ssot_request_failed',
      });
    }
  }

  /**
   * getCompanyDashboardMetrics - Asynchronously executes get company dashboard metrics.
   * @param {*} period - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async getCompanyDashboardMetrics(period = 'today') {
    if (!this.ssotClient || typeof this.ssotClient.request !== 'function') {
      throw new Error('Company Dashboard SSOT client is not configured');
    }

    return this.ssotClient.request({
      method: 'GET',
      path: `/api/v1/storefront/agents/metrics?period=${encodeURIComponent(period)}`,
      timeoutMs: 5000,
    });
  }

  /**
   * getCompanyDashboardTodayMetrics - Asynchronously executes get company dashboard today metrics.
   * @returns {*} Promise resolving result.
   */
  async getCompanyDashboardTodayMetrics() {
    return this.getCompanyDashboardMetrics('today');
  }

  /**
   * getAgents - Asynchronously executes get agents.
   * @returns {*} Promise resolving result.
   */
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
        model: profile.model || null,
        workflowCount: summary.workflowCount || 0,
        activeWorkflowCount,
        failedWorkflowCount: summary.failedWorkflowCount || 0,
        lastActivityAt: summary.lastActivityAt || null,
      });
    }));
  }

  /**
   * getWorkflows - Asynchronously executes get workflows.
   * @param {*} query - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * getWorkflowDetail - Asynchronously executes get workflow detail.
   * @param {*} workflowId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async getWorkflowDetail(workflowId) {
    if (!workflowId || workflowId.length > 128) {
      throw new TypeError('A valid workflowId is required');
    }
    const result = await this.dashboardRepository.getWorkflowDetail(workflowId);
    if (!result) return null;

    return Object.freeze({
      workflow: this.#camelizeKeys(result.workflow),
      actions: Object.freeze(result.actions.map((row) => this.#camelizeKeys(row))),
      approvals: Object.freeze(result.approvals.map((row) => this.#camelizeKeys(row))),
      timeline: Object.freeze(result.timeline.map((row) => this.#camelizeKeys(row))),
    });
  }

  #camelizeKeys(row) {
    return Object.freeze(Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_match, character) => character.toUpperCase()),
        value,
      ]),
    ));
  }
}

module.exports = ReadModelService;
