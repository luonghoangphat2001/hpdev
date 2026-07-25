'use strict';

const agentRegistry = require('../../src/domain/agents/agent-registry');
const AgentDailyReporterService = require('../../src/application/services/agent/agent-daily-reporter.service');
const DailyReportAggregatorService = require('../../src/application/services/reporting/daily-report-aggregator.service');

class OrchestratorIntegrationHarness {
  constructor() {
    this.notifications = [];
    this.metricsByAgent = new Map();
    this.reportRepository = {
      summarizeAgent: async (agentId) => this.metricsByAgent.get(agentId) || {
        workflowCount: 0,
        completedCount: 0,
        failedCount: 0,
        awaitingApprovalCount: 0,
        actionCount: 0,
      },
    };
    this.notificationGateway = {
      notify: async (notification) => {
        const duplicate = this.notifications.some(
          ({ idempotencyKey }) => idempotencyKey === notification.idempotencyKey
        );
        if (!duplicate) this.notifications.push(notification);
        return { notificationId: this.notifications.length, duplicate };
      },
    };
  }

  seedAgentMetrics(agentId, metrics) {
    if (!agentRegistry.get(agentId)) throw new Error(`Unknown agent: ${agentId}`);
    this.metricsByAgent.set(agentId, metrics);
  }

  async runDailyReport(reportDate) {
    const reporters = agentRegistry.list().map((agent) =>
      new AgentDailyReporterService({
        agent,
        reportRepository: this.reportRepository,
      }));
    const aggregator = new DailyReportAggregatorService({
      reporters,
      notificationGateway: this.notificationGateway,
      timeoutMs: 100,
    });
    return aggregator.aggregateAndNotify({
      reportDate,
      from: new Date(`${reportDate}T00:00:00Z`),
      to: new Date(`${reportDate}T23:59:59Z`),
    });
  }
}

module.exports = OrchestratorIntegrationHarness;
