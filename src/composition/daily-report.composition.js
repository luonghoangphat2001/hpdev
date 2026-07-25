'use strict';

const env = require('../config/env');
const agentRegistry = require('../domain/agents/agent-registry');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const MysqlAgentReportRepository = require('../infrastructure/database/repositories/mysql-agent-report.repository');
const DanAiNotificationClient = require('../infrastructure/http/dan-ai-notification.client');
const DanAiNotificationAdapter = require('../application/adapters/dan-ai-notification.adapter');
const AgentDailyReporterService = require('../application/services/agent/agent-daily-reporter.service');
const DailyReportAggregatorService = require('../application/services/reporting/daily-report-aggregator.service');
const DailyReportSchedulerService = require('../application/services/reporting/daily-report-scheduler.service');

function buildDailyReportScheduler({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  notificationGateway = new DanAiNotificationAdapter(
    new DanAiNotificationClient({ config: config.danAiApi })
  ),
} = {}) {
  const repository = new MysqlAgentReportRepository(pool);
  const reporters = agentRegistry.list().map((agent) =>
    new AgentDailyReporterService({ agent, reportRepository: repository }));
  const aggregator = new DailyReportAggregatorService({
    reporters,
    notificationGateway,
    timeoutMs: config.dailyReport.agentTimeoutMs,
  });
  return new DailyReportSchedulerService({
    aggregator,
    timezone: config.dailyReport.timezone,
    reportTime: config.dailyReport.time,
  });
}

module.exports = { buildDailyReportScheduler };
