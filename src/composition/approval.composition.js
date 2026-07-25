'use strict';

const env = require('../config/env');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const TransactionManager = require('../infrastructure/database/transaction-manager');
const MysqlApprovalRepository = require('../infrastructure/database/repositories/mysql-approval.repository');
const MysqlAuditRepository = require('../infrastructure/database/repositories/mysql-audit.repository');
const ApprovalDecisionService = require('../application/services/approval-decision.service');
const ApprovalController = require('../controllers/approval.controller');
const ApprovalRoute = require('../routes/approval.route');

function buildApprovalRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
} = {}) {
  const service = new ApprovalDecisionService({
    transactionManager: new TransactionManager(pool),
    approvalRepositoryFactory: (connection) => new MysqlApprovalRepository(connection),
    auditRepositoryFactory: (connection) => new MysqlAuditRepository(connection),
    allowedApproverIds: config.ceoDiscordUserIds,
  });
  return new ApprovalRoute(new ApprovalController(service)).router;
}

module.exports = { buildApprovalRouter };
