'use strict';

const env = require('../config/env');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const TransactionManager = require('../infrastructure/database/transaction-manager');
const MysqlGoalRepository = require('../infrastructure/database/repositories/mysql-goal.repository');
const MysqlOperatorControlRepository =
  require('../infrastructure/database/repositories/mysql-operator-control.repository');
const MysqlApprovalRepository =
  require('../infrastructure/database/repositories/mysql-approval.repository');
const MysqlAuditRepository =
  require('../infrastructure/database/repositories/mysql-audit.repository');
const MysqlCeoCommandRepository =
  require('../infrastructure/database/repositories/mysql-ceo-command.repository');
const GoalService = require('../application/services/goal.service');
const OperatorControlService = require('../application/services/operator-control.service');
const ApprovalDecisionService = require('../application/services/approval-decision.service');
const CeoCommandDispatcherService =
  require('../application/services/ceo-command-dispatcher.service');
const CeoCommandController = require('../controllers/ceo-command.controller');
const CeoCommandRoute = require('../routes/ceo-command.route');
const MysqlDecisionJournalRepository =
  require('../infrastructure/database/repositories/mysql-decision-journal.repository');
const DecisionJournalService = require('../application/services/decision-journal.service');

function buildCeoCommandRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
} = {}) {
  const transactionManager = new TransactionManager(pool);
  const auditFactory = (executor) => new MysqlAuditRepository(executor);
  const controlService = new OperatorControlService({
    transactionManager,
    repositoryFactory: (executor) => new MysqlOperatorControlRepository(executor),
    auditRepositoryFactory: auditFactory,
    allowedOperatorIds: config.ceoDiscordUserIds,
  });
  const approvalService = new ApprovalDecisionService({
    transactionManager,
    approvalRepositoryFactory: (executor) => new MysqlApprovalRepository(executor),
    auditRepositoryFactory: auditFactory,
    allowedApproverIds: config.ceoDiscordUserIds,
    decisionJournalFactory: (executor) => new DecisionJournalService({
      repository: new MysqlDecisionJournalRepository(executor),
    }),
  });
  const goalService = new GoalService({
    repository: new MysqlGoalRepository(pool),
  });
  const deferred = async (command) => Object.freeze({
    status: 'queued',
    commandName: command.commandName,
  });
  const handlers = {
    'goal.create': (command) => goalService.create(command),
    'workflow.control': (command) => controlService.control({
      workflowId: command.workflowId,
      operation: command.commandName.split('.')[1],
      expectedVersion: command.expectedVersion,
      actorId: command.actorId,
      reason: command.reason,
    }),
    'approval.decide': (command) => approvalService.decide({
      approvalId: command.approvalId,
      decision: command.commandName.split('.')[1],
      decisionVersion: command.decisionVersion,
      actorId: command.actorId,
      reason: command.reason,
    }),
    'portfolio.priority.change': deferred,
    'analysis.request': deferred,
  };
  const dispatcher = new CeoCommandDispatcherService({
    handlers,
    allowedActorIds: config.ceoDiscordUserIds,
    requestRepository: new MysqlCeoCommandRepository(pool),
  });
  return new CeoCommandRoute(new CeoCommandController(dispatcher)).router;
}

module.exports = { buildCeoCommandRouter };
