/**
 * @fileoverview container - Provides container functionality.
 */
'use strict';

const env = require('@config');
const mysqlPoolFactory = require('@database/mysql-pool');
const metricsRegistry = require('@utils/metrics-registry');
const { buildCapabilityRegistry } = require('@services/ai/capabilities/capability-builder');

// Repositories (5 Core Data Access)
const ApprovalRepository = require('@repositories/ApprovalRepository');
const WorkflowRepository = require('@repositories/WorkflowRepository');
const OperatorRepository = require('@repositories/OperatorRepository');
const CeoRepository = require('@repositories/CeoRepository');
const AgentRepository = require('@repositories/AgentRepository');
const DashboardReadRepository = require('@repositories/DashboardReadRepository');

// Services
const SearchService = require('@services/web/search/search.service');
const CrawlService = require('@services/web/crawl/crawl.service');
const AutomateService = require('@services/web/automate/automate.service');
const FetchService = require('@services/web/fetch/fetch.service');
const ApprovalDecisionService = require('@services/approval/decisions/approval-decision.service');
const ApprovalAggregateService = require('@services/approval/decisions/approval-aggregate.service');
const IntakeService = require('@services/operator/event/intake.service');
const OperatorControlService = require('@services/operator/control/operator-control.service');
const ReplayService = require('@services/operator/event/replay.service');
const CommandDispatcherService = require('@services/ceo/command/command-dispatcher.service');
const ExceptionInboxService = require('@services/ceo/exception/exception-inbox.service');
const ReadModelService = require('@services/reporting/dashboard/read-model.service');
const DecisionJournalPolicy = require('@policy/compliance/decision-journal.policy');
const agentRegistry = require('@services/ai/agents/agent-registry');

// Controllers (5 Core Controllers)
const WebController = require('@controllers/WebController');
const ApprovalController = require('@controllers/ApprovalController');
const CeoController = require('@controllers/CeoController');
const OperatorController = require('@controllers/OperatorController');
const DashboardController = require('@controllers/DashboardController');

/**
 * Creates and wires all OOP Controllers with their dependencies (SOLID DI).
 *
 * @param {Object} options
 * @returns {Object} map of initialized controllers
 */
function createControllers({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
} = {}) {
  // 1. Repositories
  const approvalRepository = new ApprovalRepository(pool);
  const workflowRepository = new WorkflowRepository(pool);
  const operatorRepository = new OperatorRepository(pool);
  const ceoRepository = new CeoRepository(pool);
  const agentRepository = new AgentRepository(pool);
  const dashboardReadRepository = new DashboardReadRepository(pool);

  // 2. Services
  const searchService = new SearchService(config.serperApiKey);
  const crawlService = new CrawlService(config.crawl4aiBaseUrl);
  const automateService = new AutomateService(config.stagehand);
  const fetchService = new FetchService();

  const decisionJournalService = new DecisionJournalPolicy({ decisionJournalRepository: operatorRepository });
  const approvalDecisionService = new ApprovalDecisionService({
    approvalRepository,
    auditRepository: operatorRepository,
    decisionJournalService,
  });
  const bulkApprovalService = new ApprovalAggregateService({ approvalRepository });

  const eventIntakeService = new IntakeService({
    eventRepository: operatorRepository,
    workflowRepository,
    auditRepository: operatorRepository,
  });

  const operatorControlService = new OperatorControlService({
    operatorControlRepository: operatorRepository,
    auditRepository: operatorRepository,
  });
  const eventReplayService = new ReplayService({
    eventRepository: operatorRepository,
    workflowRepository,
    auditRepository: operatorRepository,
  });

  const ceoCommandDispatcher = new CommandDispatcherService({
    goalRepository: workflowRepository,
    operatorControlRepository: operatorRepository,
    approvalRepository,
    auditRepository: operatorRepository,
    ceoCommandRepository: ceoRepository,
    decisionJournalService,
  });

  const ceoExceptionInboxService = new ExceptionInboxService({
    ceoExceptionRepository: ceoRepository,
  });

  const dashboardReadModelService = new ReadModelService({
    dashboardRepository: dashboardReadRepository,
    metricsRegistry,
    agentRegistry,
    productionEnabled: config.orchestratorProductionEnabled,
    companyDashboardUrl: config.companyDashboardUrl,
    ssotClient: null,
  });

  const capabilityRegistry = buildCapabilityRegistry();

  // 3. Controllers (5 Core Controllers)
  const webController = new WebController({ searchService, crawlService, automateService, fetchService });
  const approvalController = new ApprovalController(approvalDecisionService, bulkApprovalService);
  const ceoController = new CeoController(ceoCommandDispatcher, ceoExceptionInboxService);
  const operatorController = new OperatorController(eventIntakeService, operatorControlService, eventReplayService);
  const dashboardController = new DashboardController(dashboardReadModelService, metricsRegistry, capabilityRegistry);

  return {
    web: webController,
    search: webController,
    crawl: webController,
    automate: webController,
    fetch: webController,
    approval: approvalController,
    operator: operatorController,
    eventIntake: operatorController,
    operatorControl: operatorController,
    ceo: ceoController,
    ceoCommand: ceoController,
    ceoException: ceoController,
    dashboard: dashboardController,
    metrics: dashboardController,
    capability: dashboardController,
  };
}

module.exports = {
  createControllers,
};
