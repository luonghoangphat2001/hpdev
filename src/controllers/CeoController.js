/**
 * @fileoverview CeoController - Provides ceo functionality.
 */
'use strict';

const BaseController = require('@controllers/BaseController');

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

  #resolveDispatcher() {
    if (this.commandDispatcher) {
      return this.commandDispatcher;
    }
    if (this.dispatcher) {
      return this.dispatcher;
    }
    throw new Error('[CeoController] Command dispatcher not configured');
  }

  #resolveExceptionService() {
    if (this.exceptionService) {
      return this.exceptionService;
    }
    if (this.service) {
      return this.service;
    }
    throw new Error('[CeoController] Exception service not configured');
  }

  // --- Commands ---
  /**
   * execute - Asynchronously executes execute.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async execute(req, res) {
    const dispatcher = this.#resolveDispatcher();
    const receipt = await dispatcher.dispatch({
      commandName: req.params.commandName,
      payload: req.body?.payload,
      actorId: req.body?.actorId,
      idempotencyKey: req.body?.idempotencyKey,
    });
    if (receipt.status === 'queued') {
      return this.accepted(res, { receipt });
    }
    return this.ok(res, { receipt });
  }

  // --- Exceptions ---
  /**
   * list - Asynchronously executes list.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async list(req, res) {
    const service = this.#resolveExceptionService();
    let limit = 100;
    if (req.query && req.query.limit !== undefined) {
      const parsed = Number(req.query.limit);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = parsed;
      }
    }
    const exceptions = await service.list(limit);
    return this.ok(res, { count: exceptions.length, exceptions });
  }

  /**
   * refresh - Asynchronously executes refresh.
   * @param {*} _req - Input parameter.
   * @param {*} res - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async refresh(_req, res) {
    const service = this.#resolveExceptionService();
    const result = await service.refresh();
    return this.accepted(res, result);
  }

  /**
   * acknowledge - Asynchronously executes acknowledge.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async acknowledge(req, res) {
    const service = this.#resolveExceptionService();
    const result = await service.acknowledge(
      req.params.exceptionId,
      req.body?.actorId,
    );
    return this.ok(res, result);
  }
}

module.exports = CeoController;
