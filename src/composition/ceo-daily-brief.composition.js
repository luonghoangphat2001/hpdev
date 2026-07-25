'use strict';

const env = require('../config/env');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const MysqlCeoBriefRepository =
  require('../infrastructure/database/repositories/mysql-ceo-brief.repository');
const SsotClient = require('../infrastructure/http/ssot.client');
const SsotReadAdapter = require('../application/adapters/ssot-read.adapter');
const DanAiNotificationClient = require('../infrastructure/http/dan-ai-notification.client');
const DanAiNotificationAdapter = require('../application/adapters/dan-ai-notification.adapter');
const CeoDailyBriefService = require('../application/services/ceo/ceo-daily-brief.service');
const DailyReportSchedulerService =
  require('../application/services/reporting/daily-report-scheduler.service');

function buildCeoDailyBriefScheduler({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  notificationGateway = new DanAiNotificationAdapter(
    new DanAiNotificationClient({ config: config.danAiApi })
  ),
  financeProvider = new SsotReadAdapter({
    client: new SsotClient({ config: config.ecommerceApi }),
  }),
} = {}) {
  const brief = new CeoDailyBriefService({
    repository: new MysqlCeoBriefRepository(pool),
    financeProvider,
    notificationGateway,
    sectionTimeoutMs: config.dailyBrief.sectionTimeoutMs,
  });
  return new DailyReportSchedulerService({
    aggregator: {
      aggregateAndNotify: (period) => brief.generate(period),
    },
    timezone: config.dailyBrief.timezone,
    reportTime: config.dailyBrief.time,
  });
}

module.exports = { buildCeoDailyBriefScheduler };
