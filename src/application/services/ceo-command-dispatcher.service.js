'use strict';

const commandCatalog = require('../../contracts/commands/ceo-command.catalog');
const JsonSchemaValidator = require('../../infrastructure/validation/json-schema.validator');
const { AppError } = require('../../middlewares/error.middleware');

class CeoCommandDispatcherService {
  constructor({
    handlers,
    allowedActorIds,
    catalog = commandCatalog,
    validator = new JsonSchemaValidator(),
  }) {
    this.handlers = handlers;
    this.allowedActorIds = new Set(allowedActorIds || []);
    this.catalog = catalog;
    this.validator = validator;
  }

  async dispatch({ commandName, payload, actorId }) {
    if (!this.allowedActorIds.has(String(actorId))) {
      throw new AppError('CEO command actor is not authorized', 403);
    }
    const command = this.catalog.get(commandName);
    if (!command) throw new AppError('Unknown CEO command', 404);
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
    const result = await handler(Object.freeze({
      ...payload,
      actorId: String(actorId),
      commandName,
      commandVersion: command.version,
      risk: command.risk,
    }));
    return Object.freeze({
      command: commandName,
      version: command.version,
      result,
    });
  }
}

module.exports = CeoCommandDispatcherService;
