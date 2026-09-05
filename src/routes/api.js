/**
 * @fileoverview api - Express router mounting REST API endpoints for OpenClaw.
 * Follows SOLID principles: Single Responsibility per sub-router, Clean Architecture, and zero || chaining.
 * @module routes/api
 */
'use strict';

const { Router } = require('express');
const authMiddleware = require('@middleware/auth.middleware');
const WebhookVerificationMiddleware = require('@middleware/webhook-verification.middleware');
const SignaturePolicy = require('@policy/permissions/signature.policy');
const validateSearch = require('@validations/search.validation');
const validateFetch = require('@validations/fetch.validation');
const validateCrawl = require('@validations/crawl.validation');
const validateAutomate = require('@validations/automate.validation');
const validateEventIntake = require('@validations/event-intake.validation');
const env = require('@config');
const { getSwaggerHtml, getOpenApiSpec } = require('@docs/swaggerUi');

/**
 * Resolves controller dependency safely without || chaining.
 * @param {object} controllers
 * @param {string[]} candidateKeys
 * @returns {object|null}
 */
function resolveController(controllers, candidateKeys) {
  if (!controllers) {
    return null;
  }
  for (const key of candidateKeys) {
    if (controllers[key]) {
      return controllers[key];
    }
  }
  return null;
}

/**
 * Builds and mounts all OpenClaw API routes grouped cleanly by domain.
 * @param {object} [controllers={}]
 * @returns {import('express').Router}
 */
function createApiRouter(controllers = {}) {
  const router = Router();

  // ─── 0. API Documentation (Swagger UI & Spec) ─────────────────────────────
  const docsRouter = Router();
  docsRouter.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(getSwaggerHtml());
  });
  docsRouter.get('/spec', (_req, res) => {
    res.json(getOpenApiSpec());
  });
  router.use('/docs', docsRouter);
  router.get('/openapi.json', (_req, res) => {
    res.json(getOpenApiSpec());
  });

  // ─── 1. Web Tools Endpoints (Grouped & Root-aliased) ───────────────────────
  const webController = resolveController(controllers, ['web', 'search', 'fetch', 'crawl', 'automate']);
  if (webController) {
    const toolsRouter = Router();
    toolsRouter.post('/search', validateSearch, webController.search.bind(webController));
    toolsRouter.post('/fetch', validateFetch, webController.fetch.bind(webController));
    toolsRouter.post('/crawl', validateCrawl, webController.crawl.bind(webController));
    toolsRouter.post('/automate', validateAutomate, webController.automate.bind(webController));

    // Mount at /tools for modular REST architecture
    router.use('/tools', toolsRouter);

    // Root-level aliases for backward compatibility with existing callers
    router.post('/search', validateSearch, webController.search.bind(webController));
    router.post('/fetch', validateFetch, webController.fetch.bind(webController));
    router.post('/crawl', validateCrawl, webController.crawl.bind(webController));
    router.post('/automate', validateAutomate, webController.automate.bind(webController));
  }

  // ─── 2. Public Webhook Ingestion ──────────────────────────────────────────
  const eventController = resolveController(controllers, ['operator', 'eventIntake']);
  if (eventController) {
    let secret = 'test-secret';
    if (env.apiSecret) {
      secret = env.apiSecret;
    }
    let keys = { 'default-key': secret };
    if (env.ecommerceWebhookKeysJson) {
      try {
        const parsed = JSON.parse(env.ecommerceWebhookKeysJson);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          keys = parsed;
        }
      } catch (_) {}
    }
    const webhookService = new SignaturePolicy({ keys });
    const webhookMiddleware = new WebhookVerificationMiddleware({ webhookService });

    router.post(
      '/orchestrator/v1/events',
      webhookMiddleware.handle.bind(webhookMiddleware),
      validateEventIntake,
      eventController.ingest.bind(eventController)
    );
  }

  // ─── 3. Authenticated Orchestrator Sub-Routers ─────────────────────────────
  const orchestratorRouter = Router();
  orchestratorRouter.use(authMiddleware);

  // Approvals Router Group
  const approvalController = resolveController(controllers, ['approval']);
  if (approvalController) {
    const approvalsRouter = Router();
    approvalsRouter.post('/:approvalId/decision', approvalController.decide.bind(approvalController));
    orchestratorRouter.use('/approvals', approvalsRouter);
  }

  // Operator Control Router Group
  const opController = resolveController(controllers, ['operator', 'operatorControl']);
  if (opController) {
    const controlRouter = Router();
    controlRouter.get('/status', opController.getStatus.bind(opController));
    controlRouter.post('/level', opController.setLevel.bind(opController));
    controlRouter.post('/emergency-stop', opController.emergencyStop.bind(opController));
    controlRouter.post('/resume', opController.resume.bind(opController));
    controlRouter.post('/replay', opController.replay.bind(opController));
    orchestratorRouter.use('/control', controlRouter);
  }

  // CEO Commands & Exceptions Router Group
  const ceoController = resolveController(controllers, ['ceo', 'ceoCommand', 'ceoException']);
  if (ceoController) {
    const commandsRouter = Router();
    commandsRouter.post('/:commandName', ceoController.execute.bind(ceoController));
    orchestratorRouter.use('/commands', commandsRouter);

    const exceptionsRouter = Router();
    exceptionsRouter.get('/', ceoController.list.bind(ceoController));
    exceptionsRouter.post('/refresh', ceoController.refresh.bind(ceoController));
    exceptionsRouter.post('/:exceptionId/ack', ceoController.acknowledge.bind(ceoController));
    orchestratorRouter.use('/exceptions', exceptionsRouter);
  }

  // Dashboard Router Group
  const dashboardController = resolveController(controllers, ['dashboard']);
  if (dashboardController) {
    const dashboardRouter = Router();
    dashboardRouter.get('/overview', dashboardController.overview.bind(dashboardController));
    dashboardRouter.get('/realtime', dashboardController.realtime.bind(dashboardController));
    dashboardRouter.get('/agents', dashboardController.getAgents.bind(dashboardController));
    dashboardRouter.post('/agents/:agentId/control', dashboardController.controlAgent.bind(dashboardController));
    dashboardRouter.get('/workflows', dashboardController.getWorkflows.bind(dashboardController));
    dashboardRouter.get('/workflows/:workflowId', dashboardController.getWorkflowDetail.bind(dashboardController));
    dashboardRouter.get('/company/today-metrics', dashboardController.getCompanyDashboardTodayMetrics.bind(dashboardController));
    dashboardRouter.get('/company/metrics', dashboardController.getCompanyDashboardMetrics.bind(dashboardController));
    dashboardRouter.get('/metrics', dashboardController.metrics.bind(dashboardController));
    dashboardRouter.get('/capabilities', dashboardController.capabilities.bind(dashboardController));
    orchestratorRouter.use('/dashboard', dashboardRouter);
  }

  router.use('/orchestrator/v1', orchestratorRouter);

  return router;
}

module.exports = createApiRouter;
