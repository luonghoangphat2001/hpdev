/**
 * @fileoverview api - Provides api functionality.
 */
'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const WebhookVerificationMiddleware = require('../middleware/webhook-verification.middleware');
const SignaturePolicy = require('../policy/permissions/signature.policy');
const validateSearch = require('../validations/search.validation');
const validateFetch = require('../validations/fetch.validation');
const validateCrawl = require('../validations/crawl.validation');
const validateAutomate = require('../validations/automate.validation');
const validateEventIntake = require('../validations/event-intake.validation');
const env = require('../config/env');

/**
 * Mount all REST API endpoints for OpenClaw.
 * Follows SOLID & Clean OOP Controller Injection.
 *
 * @param {Object} controllers
 * @returns {import('express').Router}
 */
function createApiRouter(controllers = {}) {
  const router = Router();

  // ─── 1. Web Tools Endpoints ──────────────────────────────────────────
  if (controllers.search) {
    router.post('/search', validateSearch, controllers.search.search.bind(controllers.search));
  }
  if (controllers.fetch) {
    router.post('/fetch', validateFetch, controllers.fetch.fetch.bind(controllers.fetch));
  }
  if (controllers.crawl) {
    router.post('/crawl', validateCrawl, controllers.crawl.crawl.bind(controllers.crawl));
  }
  if (controllers.automate) {
    router.post('/automate', validateAutomate, controllers.automate.automate.bind(controllers.automate));
  }

  // ─── 2. Public Webhook Ingestion ─────────────────────────────────────
  if (controllers.eventIntake) {
    const webhookService = new SignaturePolicy({
      secret: env.webhook?.secret || 'test-secret',
    });
    const webhookMiddleware = new WebhookVerificationMiddleware({
      webhookService,
    });
    router.post(
      '/orchestrator/v1/events',
      webhookMiddleware.handle.bind(webhookMiddleware),
      validateEventIntake,
      controllers.eventIntake.ingest.bind(controllers.eventIntake)
    );
  }

  // ─── 3. Authenticated Orchestrator Endpoints ─────────────────────────
  const orchestratorRouter = Router();
  orchestratorRouter.use(authMiddleware);

  if (controllers.metrics) {
    orchestratorRouter.get('/metrics', controllers.metrics.get.bind(controllers.metrics));
  }
  if (controllers.capability) {
    orchestratorRouter.get('/capabilities', controllers.capability.list.bind(controllers.capability));
  }

  // Approvals
  if (controllers.approval) {
    orchestratorRouter.get('/approvals', controllers.approval.list.bind(controllers.approval));
    orchestratorRouter.get('/approvals/:approvalId', controllers.approval.get.bind(controllers.approval));
    orchestratorRouter.post('/approvals/:approvalId/decision', controllers.approval.decide.bind(controllers.approval));
    orchestratorRouter.post('/approvals/bulk-decision', controllers.approval.bulkDecide.bind(controllers.approval));
  }

  // Operator Control
  if (controllers.operatorControl) {
    orchestratorRouter.post('/control/pause', controllers.operatorControl.pause.bind(controllers.operatorControl));
    orchestratorRouter.post('/control/resume', controllers.operatorControl.resume.bind(controllers.operatorControl));
    orchestratorRouter.post('/control/emergency-stop', controllers.operatorControl.emergencyStop.bind(controllers.operatorControl));
    orchestratorRouter.post('/control/replay', controllers.operatorControl.replay.bind(controllers.operatorControl));
  }

  // CEO Commands
  if (controllers.ceoCommand) {
    orchestratorRouter.post('/commands', controllers.ceoCommand.dispatch.bind(controllers.ceoCommand));
  }

  // CEO Exceptions
  if (controllers.ceoException) {
    orchestratorRouter.get('/exceptions', controllers.ceoException.list.bind(controllers.ceoException));
    orchestratorRouter.get('/exceptions/:exceptionId', controllers.ceoException.get.bind(controllers.ceoException));
    orchestratorRouter.post('/exceptions/:exceptionId/resolve', controllers.ceoException.resolve.bind(controllers.ceoException));
  }

  // Dashboard
  if (controllers.dashboard) {
    orchestratorRouter.get('/dashboard/overview', controllers.dashboard.overview.bind(controllers.dashboard));
    orchestratorRouter.get('/dashboard/realtime', controllers.dashboard.realtime.bind(controllers.dashboard));
  }

  router.use('/orchestrator/v1', orchestratorRouter);

  return router;
}

module.exports = createApiRouter;
