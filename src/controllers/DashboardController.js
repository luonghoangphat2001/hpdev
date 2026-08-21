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
