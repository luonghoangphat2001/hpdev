/**
 * @fileoverview daily-brief.builder - Provides daily-brief functionality.
 */
'use strict';

const env = require('@config/config');
const mysqlPoolFactory = require('@database/mysql-pool');
const CeoRepository = require('@repositories/CeoRepository');
const SsotClient = require('@services/notification/adapter/ssot.client');
const SsotReadAdapter = require('@services/notification/adapter/ssot-read.adapter');
const DanAiClient = require('@services/notification/adapter/dan-ai.client');
const DanAiAdapter = require('@services/notification/adapter/dan-ai.adapter');
const DailyBriefService = require('@services/ceo/daily/daily-brief.service');
const ReportSchedulerService = require('@services/reporting/daily/report-scheduler.service');

function buildCeoDailyBriefScheduler({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  notificationGateway = new DanAiAdapter(
    new DanAiClient({ config: config.danAiApi })
  ),
  financeProvider = new SsotReadAdapter({
    client: new SsotClient({ config: config.ecommerceApi }),
  }),
} = {}) {
  const brief = new DailyBriefService({
    repository: new CeoRepository(pool),
    financeProvider,
    notificationGateway,
    sectionTimeoutMs: config.dailyBrief?.sectionTimeoutMs,
  });
  return new ReportSchedulerService({
    aggregator: {
      aggregateAndNotify: (period) => brief.generate(period),
    },
    timezone: config.dailyBrief?.timezone,
    reportTime: config.dailyBrief?.time,
  });
}

module.exports = { buildCeoDailyBriefScheduler };
