/**
 * @fileoverview OperatorController - Provides operator functionality.
 */
'use strict';

const BaseController = require('./BaseController');

/**
 * OperatorController
 * Manages operator logic.
 */
class OperatorController extends BaseController {
  /**
   * constructor - Executes constructor.
   * @param {*} intakeServiceOrControls - Input parameter.
   * @param {*} controlService - Input parameter.
   * @param {*} replayService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(intakeServiceOrControls, controlService, replayService) {
    super();
    if (controlService) {
      this.intakeService = intakeServiceOrControls;
      this.controlService = controlService;
      this.replayService = replayService;
    } else if (intakeServiceOrControls && typeof intakeServiceOrControls.intake === 'function') {
      this.intakeService = intakeServiceOrControls;
    } else {
      this.controlService = intakeServiceOrControls;
      this.replayService = arguments[1];
    }
  }

  /**
   * intake - Asynchronously executes intake.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async intake(req, res) {
    const service = this.intakeService || this.service;
    const fn = service.intake || service.accept || service.ingest;
    const result = await fn.call(service, req.body);
    return res.status(202).json({
      event_id: result.eventId || result.event_id,
      ...result,
    });
  }

  /**
   * create - Asynchronously executes create.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async create(req, res) {
    return this.intake(req, res);
  }

  /**
   * ingest - Asynchronously executes ingest.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async ingest(req, res) {
    return this.intake(req, res);
  }

  /**
   * getStatus - Asynchronously executes get status.
   * @param {*} _req - Input parameter.
   * @param {*} res - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async getStatus(_req, res) {
    const status = await this.controlService.getStatus();
    return this.ok(res, { ok: true, status });
  }

  /**
   * setLevel - Asynchronously executes set level.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async setLevel(req, res) {
    const { level } = req.body || {};
    const result = await this.controlService.setLevel(level, req.body?.actorId);
    return this.ok(res, { ok: true, ...result });
  }

  /**
   * emergencyStop - Asynchronously executes emergency stop.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async emergencyStop(req, res) {
    const result = await this.controlService.emergencyStop(req.body?.reason, req.body?.actorId);
    return this.ok(res, { ok: true, ...result });
  }

  /**
   * resume - Asynchronously executes resume.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async resume(req, res) {
    const result = await this.controlService.resume(req.body?.actorId);
    return this.ok(res, { ok: true, ...result });
  }

  /**
   * replay - Asynchronously executes replay.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async replay(req, res) {
    const result = await this.replayService.replay(req.body || {});
    return this.accepted(res, { ok: true, ...result });
  }
}

module.exports = OperatorController;
