'use strict';

const env = require('../config/env');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const TransactionManager = require('../infrastructure/database/transaction-manager');
const MysqlOperatorControlRepository = require('../infrastructure/database/repositories/mysql-operator-control.repository');
const MysqlAuditRepository = require('../infrastructure/database/repositories/mysql-audit.repository');
const MysqlEventRepository = require('../infrastructure/database/repositories/mysql-event.repository');
const OperatorControlService = require('../application/services/operator/operator-control.service');
const EventReplayService = require('../application/services/operator/event-replay.service');
const OperatorControlController = require('../controllers/operator-control.controller');
const OperatorControlRoute = require('../routes/operator-control.route');

function buildOperatorControlRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  simulator = {
    simulate: async (payload) => ({
      safe: true,
      writesAllowed: payload.writesAllowed,
      eventType: payload.eventType,
    }),
  },
  dispatcher = null,
} = {}) {
  const transactionManager = new TransactionManager(pool);
  const controlService = new OperatorControlService({
    transactionManager,
    repositoryFactory: (executor) => new MysqlOperatorControlRepository(executor),
    auditRepositoryFactory: (executor) => new MysqlAuditRepository(executor),
    allowedOperatorIds: config.ceoDiscordUserIds,
  });
  const replayService = new EventReplayService({
    eventRepository: new MysqlEventRepository(pool),
    simulator,
    dispatcher,
    allowedOperatorIds: config.ceoDiscordUserIds,
    productionEnabled: config.orchestratorProductionEnabled,
  });
  return new OperatorControlRoute(
    new OperatorControlController({ controlService, replayService })
  ).router;
}

module.exports = { buildOperatorControlRouter };
