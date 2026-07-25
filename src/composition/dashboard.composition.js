'use strict';

const env = require('../config/env');
const metricsRegistry = require('../infrastructure/observability');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const MysqlDashboardReadRepository =
  require('../infrastructure/database/repositories/mysql-dashboard-read.repository');
const DashboardReadModelService =
  require('../application/services/monitoring/dashboard-read-model.service');
const DashboardController = require('../controllers/dashboard.controller');
const DashboardRoute = require('../routes/dashboard.route');
const agentRegistry = require('../domain/agents/agent-registry');
const TransactionManager = require('../infrastructure/database/transaction-manager');
const MysqlAgentRuntimeStateRepository =
  require('../infrastructure/database/repositories/mysql-agent-runtime-state.repository');
const MysqlAuditRepository =
  require('../infrastructure/database/repositories/mysql-audit.repository');
const PersistentAgentLifecycleService =
  require('../application/services/agent/persistent-agent-lifecycle.service');
const SsotClient = require('../infrastructure/http/ssot.client');

function buildDashboardRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  metrics = metricsRegistry,
} = {}) {
  const repository = new MysqlDashboardReadRepository(pool);
  const ssotConfigured = Boolean(
    config.ecommerceApi?.baseUrl
      && config.ecommerceApi?.agentCode
      && config.ecommerceApi?.agentToken,
  );
  const service = new DashboardReadModelService({
    dashboardRepository: repository,
    metricsRegistry: metrics,
    agentRegistry,
    productionEnabled: config.orchestratorProductionEnabled,
    ssotClient: ssotConfigured
      ? new SsotClient({ config: config.ecommerceApi })
      : null,
    companyDashboardUrl: config.ecommerceApi?.baseUrl || null,
  });
  const lifecycleService = new PersistentAgentLifecycleService({
    transactionManager: new TransactionManager(pool),
    repositoryFactory: (executor) => new MysqlAgentRuntimeStateRepository(executor),
    auditRepositoryFactory: (executor) => new MysqlAuditRepository(executor),
    agentRegistry,
    allowedActorIds: config.ceoOperatorIds,
  });
  return new DashboardRoute(
    new DashboardController(service, lifecycleService),
  ).router;
}

module.exports = { buildDashboardRouter };
