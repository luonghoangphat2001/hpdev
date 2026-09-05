/**
 * @fileoverview daily-report.builder - Provides daily-report functionality.
 */
'use strict';

const env = require('@config/config');
const agentRegistry = require('@services/ai/agents/agent-registry');
const mysqlPoolFactory = require('@database/mysql-pool');
const AgentRepository = require('@repositories/AgentRepository');
const DanAiClient = require('@services/notification/adapter/dan-ai.client');
const DanAiAdapter = require('@services/notification/adapter/dan-ai.adapter');
const DailyReporterService = require('@services/ai/lifecycle/daily-reporter.service');
const ReportAggregatorService = require('@services/reporting/daily/report-aggregator.service');
const ReportSchedulerService = require('@services/reporting/daily/report-scheduler.service');

function buildDailyReportScheduler({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  notificationClient = new DanAiClient(config.danAiIntegration),
} = {}) {
  const agentReportRepository = new AgentRepository(pool);
  const notificationAdapter = new DanAiAdapter(notificationClient);
  const reporterService = new DailyReporterService({
    agentRegistry,
    agentReportRepository,
  });
  const aggregatorService = new ReportAggregatorService({
    agentRegistry,
    agentReportRepository,
    reporterService,
    notificationAdapter,
  });
  return new ReportSchedulerService({
    cronExpression: config.dailyReport?.cron || '0 0 * * *',
    aggregatorService,
  });
}

module.exports = {
  buildDailyReportScheduler,
};
