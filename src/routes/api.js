/**
 * @fileoverview api - Express router mounting REST API endpoints for OpenClaw.
 * @module routes/api
 */
'use strict';

const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const WebhookVerificationMiddleware = require("../middleware/webhook-verification.middleware");
const SignaturePolicy = require("../policy/permissions/signature.policy");
const validateSearch = require("../validations/search.validation");
const validateFetch = require("../validations/fetch.validation");
const validateCrawl = require("../validations/crawl.validation");
const validateAutomate = require("../validations/automate.validation");
const validateEventIntake = require("../validations/event-intake.validation");
const env = require("../config/env");

/**
 * Mount all REST API endpoints for OpenClaw.
 * Follows SOLID & Clean OOP Controller Injection.
 *
 * @param {Object} controllers
 * @returns {import("express").Router}
 */
function createApiRouter(controllers = {}) {
  const router = Router();

  // ─── 1. Web Tools Endpoints ──────────────────────────────────────────
  const webController = controllers.web || controllers.search || controllers.fetch || controllers.crawl || controllers.automate;
  if (webController) {
    router.post("/search", validateSearch, (controllers.search || webController).search.bind(controllers.search || webController));
    router.post("/fetch", validateFetch, (controllers.fetch || webController).fetch.bind(controllers.fetch || webController));
    router.post("/crawl", validateCrawl, (controllers.crawl || webController).crawl.bind(controllers.crawl || webController));
    router.post("/automate", validateAutomate, (controllers.automate || webController).automate.bind(controllers.automate || webController));
  }

  // ─── 2. Public Webhook Ingestion ─────────────────────────────────────
  const eventController = controllers.operator || controllers.eventIntake;
  if (eventController) {
    let keys = { "default-key": env.apiSecret || "test-secret" };
    if (env.ecommerceWebhookKeysJson) {
      try {
        const parsed = JSON.parse(env.ecommerceWebhookKeysJson);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          keys = parsed;
        }
      } catch (_) {}
    }
    const webhookService = new SignaturePolicy({ keys });
    const webhookMiddleware = new WebhookVerificationMiddleware({
      webhookService,
    });
    router.post(
      "/orchestrator/v1/events",
      webhookMiddleware.handle.bind(webhookMiddleware),
      validateEventIntake,
      eventController.ingest.bind(eventController)
    );
  }

  // ─── 3. Authenticated Orchestrator Endpoints ─────────────────────────
  const orchestratorRouter = Router();
  orchestratorRouter.use(authMiddleware);

  // Approvals
  const approvalController = controllers.approval;
  if (approvalController) {
    orchestratorRouter.post("/approvals/:approvalId/decision", approvalController.decide.bind(approvalController));
  }

  // Operator Control
  const opController = controllers.operator || controllers.operatorControl;
  if (opController) {
    orchestratorRouter.get("/control/status", opController.getStatus.bind(opController));
    orchestratorRouter.post("/control/level", opController.setLevel.bind(opController));
    orchestratorRouter.post("/control/emergency-stop", opController.emergencyStop.bind(opController));
    orchestratorRouter.post("/control/resume", opController.resume.bind(opController));
    orchestratorRouter.post("/control/replay", opController.replay.bind(opController));
  }

  // CEO Commands & Exceptions
  const ceoController = controllers.ceo || controllers.ceoCommand || controllers.ceoException;
  if (ceoController) {
    orchestratorRouter.post("/commands/:commandName", ceoController.execute.bind(ceoController));
    orchestratorRouter.get("/exceptions", ceoController.list.bind(ceoController));
    orchestratorRouter.post("/exceptions/refresh", ceoController.refresh.bind(ceoController));
    orchestratorRouter.post("/exceptions/:exceptionId/ack", ceoController.acknowledge.bind(ceoController));
  }

  // Dashboard
  const dashboardController = controllers.dashboard;
  if (dashboardController) {
    orchestratorRouter.get("/dashboard/overview", dashboardController.overview.bind(dashboardController));
    orchestratorRouter.get("/dashboard/realtime", dashboardController.realtime.bind(dashboardController));
  }

  router.use("/orchestrator/v1", orchestratorRouter);

  return router;
}

module.exports = createApiRouter;
