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

function buildDashboardRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  metrics = metricsRegistry,
} = {}) {
  const repository = new MysqlDashboardReadRepository(pool);
  const service = new DashboardReadModelService({
    dashboardRepository: repository,
    metricsRegistry: metrics,
    agentRegistry,
    productionEnabled: config.orchestratorProductionEnabled,
  });
  return new DashboardRoute(new DashboardController(service)).router;
}

module.exports = { buildDashboardRouter };
