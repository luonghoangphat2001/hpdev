/**
 * @fileoverview daily-brief.builder - Provides daily-brief functionality.
 */
'use strict';

const env = require('../../../config/env');
const mysqlPoolFactory = require('../../../database/mysql-pool');
const CeoRepository = require('../../../repositories/CeoRepository');
const SsotClient = require('../../notification/adapter/ssot.client');
const SsotReadAdapter = require('../../notification/adapter/ssot-read.adapter');
const DanAiClient = require('../../notification/adapter/dan-ai.client');
const DanAiAdapter = require('../../notification/adapter/dan-ai.adapter');
const DailyBriefService = require('./daily-brief.service');
const ReportSchedulerService = require('../../reporting/daily/report-scheduler.service');

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
