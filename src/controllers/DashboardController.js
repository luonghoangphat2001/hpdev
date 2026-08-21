/**
 * @fileoverview DashboardController - Provides dashboard functionality.
 */
'use strict';

const BaseController = require('./BaseController');

/**
 * DashboardController
 * Manages dashboard logic.
 */
class DashboardController extends BaseController {
  /**
   * constructor - Executes constructor.
   * @param {*} readModelService - Input parameter.
   * @param {*} metricsRegistryOrLifecycle - Input parameter.
   * @param {*} capabilityRegistry - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(readModelService, metricsRegistryOrLifecycle, capabilityRegistry) {
    super();
    this.readModelService = readModelService;
    if (metricsRegistryOrLifecycle && typeof metricsRegistryOrLifecycle.transition === 'function') {
      this.lifecycleService = metricsRegistryOrLifecycle;
    } else {
      this.metricsRegistry = metricsRegistryOrLifecycle;
      this.capabilityRegistry = capabilityRegistry;
    }
  }

  /**
   * overview - Asynchronously executes overview.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async overview(req, res) {
    const days = Number(req.query?.days) || 7;
    const data = await this.readModelService.getOverview({ days });
    return this.ok(res, data);
  }

  /**
   * realtime - Asynchronously executes realtime.
   * @param {*} _req - Input parameter.
   * @param {*} res - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async realtime(_req, res) {
    const data = await this.readModelService.getRealtime();
    return this.ok(res, data);
  }

  /**
   * controlAgent - Asynchronously executes control agent.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async controlAgent(req, res) {
    const service = this.lifecycleService;
    const result = await service.transition({
      agentId: req.params.agentId,
      toState: req.body?.toState,
      expectedVersion: req.body?.expectedVersion,
      actorId: req.body?.actorId,
      reason: req.body?.reason,
    });
    return this.ok(res, { ok: true, ...result });
  }

  /**
   * metrics - Asynchronously executes metrics.
   * @param {*} _req - Input parameter.
   * @param {*} res - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async metrics(_req, res) {
    if (this.metricsRegistry && typeof this.metricsRegistry.formatPrometheus === 'function') {
      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      return res.send(this.metricsRegistry.formatPrometheus());
    }
    return this.ok(res, { ok: true, metrics: {} });
  }

  /**
   * getAgents - Asynchronously executes get agents.
   * @param {import('express').Request} _req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async getAgents(_req, res) {
    const agents = await this.readModelService.getAgents();
    return this.ok(res, { ok: true, count: agents.length, agents });
  }

  /**
   * getWorkflows - Asynchronously executes get workflows.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async getWorkflows(req, res) {
    const data = await this.readModelService.getWorkflows(req.query);
    return this.ok(res, { ok: true, ...data });
  }

  /**
   * getWorkflowDetail - Asynchronously executes get workflow detail.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async getWorkflowDetail(req, res) {
    const data = await this.readModelService.getWorkflowDetail(req.params.workflowId);
    if (!data) {
      return res.status(404).json({ ok: false, error: 'Workflow not found' });
    }
    return this.ok(res, { ok: true, ...data });
  }

  /**
   * getCompanyDashboardTodayMetrics - Asynchronously executes today metrics.
   * @param {import('express').Request} _req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async getCompanyDashboardTodayMetrics(_req, res) {
    const data = await this.readModelService.getCompanyDashboardTodayMetrics();
    return this.ok(res, { ok: true, data });
  }

  /**
   * getCompanyDashboardMetrics - Asynchronously executes company metrics by period.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async getCompanyDashboardMetrics(req, res) {
    const data = await this.readModelService.getCompanyDashboardMetrics(req.query?.period || 'today');
    return this.ok(res, { ok: true, data });
  }

  /**
   * capabilities - Asynchronously executes capabilities.
   * @param {*} _req - Input parameter.
   * @param {*} res - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async capabilities(_req, res) {
    const list = this.capabilityRegistry ? this.capabilityRegistry.list() : [];
    return this.ok(res, { ok: true, count: list.length, capabilities: list });
  }
}

module.exports = DashboardController;
