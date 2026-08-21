/**
 * @fileoverview CeoController - Provides ceo functionality.
 */
'use strict';

const BaseController = require('./BaseController');

/**
 * CeoController
 * Manages ceo logic.
 */
class CeoController extends BaseController {
  /**
   * constructor - Executes constructor.
   * @param {*} commandDispatcherOrService - Input parameter.
   * @param {*} exceptionService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(commandDispatcherOrService, exceptionService) {
    super();
    if (exceptionService) {
      this.commandDispatcher = commandDispatcherOrService;
      this.exceptionService = exceptionService;
    } else if (commandDispatcherOrService && typeof commandDispatcherOrService.dispatch === 'function') {
      this.commandDispatcher = commandDispatcherOrService;
      this.dispatcher = commandDispatcherOrService;
    } else {
      this.exceptionService = commandDispatcherOrService;
      this.service = commandDispatcherOrService;
    }
  }

  // --- Commands ---
  /**
   * execute - Asynchronously executes execute.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async execute(req, res) {
    const dispatcher = this.commandDispatcher || this.dispatcher;
    const receipt = await dispatcher.dispatch({
      commandName: req.params.commandName,
      payload: req.body?.payload,
      actorId: req.body?.actorId,
      idempotencyKey: req.body?.idempotencyKey,
    });
    return res.status(receipt.status === 'queued' ? 202 : 200).json({
      ok: true,
      receipt,
    });
  }

  // --- Exceptions ---
  /**
   * list - Asynchronously executes list.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async list(req, res) {
    const service = this.exceptionService || this.service;
    const exceptions = await service.list(Number(req.query.limit || 100));
    return this.ok(res, { count: exceptions.length, exceptions });
  }

  /**
   * refresh - Asynchronously executes refresh.
   * @param {*} _req - Input parameter.
   * @param {*} res - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async refresh(_req, res) {
    const service = this.exceptionService || this.service;
    const result = await service.refresh();
    return this.accepted(res, { ok: true, ...result });
  }

  /**
   * acknowledge - Asynchronously executes acknowledge.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async acknowledge(req, res) {
    const service = this.exceptionService || this.service;
    const result = await service.acknowledge(
      req.params.exceptionId,
      req.body?.actorId,
    );
    return this.ok(res, { ok: true, ...result });
  }
}

module.exports = CeoController;
