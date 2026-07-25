'use strict';

const env = require('../config/env');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const TransactionManager = require('../infrastructure/database/transaction-manager');
const MysqlApprovalRepository = require('../infrastructure/database/repositories/mysql-approval.repository');
const MysqlAuditRepository = require('../infrastructure/database/repositories/mysql-audit.repository');
const ApprovalDecisionService = require('../application/services/approval/approval-decision.service');
const ApprovalController = require('../controllers/approval.controller');
const ApprovalRoute = require('../routes/approval.route');
const MysqlDecisionJournalRepository =
  require('../infrastructure/database/repositories/mysql-decision-journal.repository');
const DecisionJournalService = require('../application/services/compliance/decision-journal.service');

function buildApprovalRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
} = {}) {
  const service = new ApprovalDecisionService({
    transactionManager: new TransactionManager(pool),
    approvalRepositoryFactory: (connection) => new MysqlApprovalRepository(connection),
    auditRepositoryFactory: (connection) => new MysqlAuditRepository(connection),
    allowedApproverIds: config.ceoDiscordUserIds,
    decisionJournalFactory: (connection) => new DecisionJournalService({
      repository: new MysqlDecisionJournalRepository(connection),
    }),
  });
  return new ApprovalRoute(new ApprovalController(service)).router;
}

module.exports = { buildApprovalRouter };
