'use strict';

const env = require('../config/env');
const metrics = require('../infrastructure/observability');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const MysqlIntelligenceObservabilityRepository =
  require('../infrastructure/database/repositories/mysql-intelligence-observability.repository');
const DanAiNotificationClient = require('../infrastructure/http/dan-ai-notification.client');
const DanAiNotificationAdapter = require('../application/adapters/dan-ai-notification.adapter');
const IntelligenceTelemetryService =
  require('../application/services/intelligence-telemetry.service');

function buildIntelligenceTelemetry({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  notificationGateway = new DanAiNotificationAdapter(
    new DanAiNotificationClient({ config: config.danAiApi })
  ),
} = {}) {
  return new IntelligenceTelemetryService({
    repository: new MysqlIntelligenceObservabilityRepository(pool),
    metrics,
    notificationGateway,
    thresholds: config.intelligenceWarnings,
  });
}

module.exports = { buildIntelligenceTelemetry };
