'use strict';

const agentRegistry = require('../../src/services/ai/agents/agent-registry');
const DailyReporterService = require('../../src/services/ai/lifecycle/daily-reporter.service');
const ReportAggregatorService = require('../../src/services/reporting/daily/report-aggregator.service');

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
      new DailyReporterService({
        agent,
        reportRepository: this.reportRepository,
      }));
    const aggregator = new ReportAggregatorService({
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
