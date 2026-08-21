/**
 * @fileoverview command-dispatcher.service - Provides command-dispatcher functionality.
 */
'use strict';

const commandCatalog = require('../../../schemas/ceo/command.catalog');
const JsonSchemaValidator = require('../../../utils/json-schema.validator');
const AppError = require('../../../utils/errors/app.error');
const crypto = require('crypto');

/**
 * CommandDispatcherService
 * Manages command dispatcher logic.
 */
class CommandDispatcherService {
  constructor({
    handlers,
    allowedActorIds,
    catalog = commandCatalog,
    validator = new JsonSchemaValidator(),
    requestRepository = null,
    clock = () => new Date(),
    idFactory = () => `cmd_${crypto.randomUUID()}`,
  }) {
    this.handlers = handlers;
    this.allowedActorIds = new Set(allowedActorIds || []);
    this.catalog = catalog;
    this.validator = validator;
    this.requestRepository = requestRepository;
    this.clock = clock;
    this.idFactory = idFactory;
  }

  /**
   * dispatch - Asynchronously executes dispatch.
   * @param {*} commandName - Input parameter.
   * @param {*} payload - Input parameter.
   * @param {*} actorId - Input parameter.
   * @param {*} idempotencyKey - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async dispatch({ commandName, payload, actorId, idempotencyKey }) {
    if (!this.allowedActorIds.has(String(actorId))) {
      throw new AppError('CEO command actor is not authorized', 403);
    }
    const command = this.catalog.get(commandName);
    if (!command) throw new AppError('Unknown CEO command', 404);
    if (!idempotencyKey || String(idempotencyKey).length > 160) {
      throw new AppError('Valid idempotencyKey is required', 400);
    }
    const validation = this.validator.validate(command.inputSchema, payload || {});
    if (!validation.valid) {
      throw new AppError('CEO command payload is invalid', 422, {
        code: 'ceo_command_invalid',
        errors: validation.errors,
      });
    }
    const handler = this.handlers[command.handler];
    if (typeof handler !== 'function') {
      throw new AppError('CEO command handler is unavailable', 503);
    }
    const existing = this.requestRepository
      ? await this.requestRepository.findByIdempotencyKey(idempotencyKey)
      : null;
    if (existing) {
      return Object.freeze({
        requestId: existing.request_id,
        command: existing.command_name,
        version: existing.command_version,
        status: existing.status,
        duplicate: true,
        result: this.#json(existing.result),
      });
    }
    const requestId = this.idFactory();
    if (this.requestRepository) {
      await this.requestRepository.create({
        requestId,
        idempotencyKey,
        commandName,
        commandVersion: command.version,
        actorId: String(actorId),
        risk: command.risk,
        payload,
      });
    }
    try {
      const result = await handler(Object.freeze({
        ...payload,
        actorId: String(actorId),
        commandName,
        commandVersion: command.version,
        risk: command.risk,
      }));
      if (this.requestRepository) {
        await this.requestRepository.complete(requestId, result, this.clock());
      }
      return Object.freeze({
        requestId,
        command: commandName,
        version: command.version,
        status: result?.status === 'queued' ? 'queued' : 'completed',
        duplicate: false,
        result,
      });
    } catch (error) {
      if (this.requestRepository) {
        await this.requestRepository.fail(
          requestId,
          error.code || 'ceo_command_failed',
          this.clock(),
        );
      }
      throw error;
    }
  }

  #json(value) {
    if (!value) return null;
    return typeof value === 'string' ? JSON.parse(value) : value;
  }
}

module.exports = CommandDispatcherService;
