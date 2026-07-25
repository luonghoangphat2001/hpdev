'use strict';

const actionCatalog = require('../../contracts/actions/ecommerce-action.catalog');
const actionSchemas = require('../../contracts/actions/ecommerce-action.schemas');
const JsonSchemaValidator = require('../../infrastructure/validation/json-schema.validator');
const { AppError } = require('../../middlewares/error.middleware');

class ActionValidatorService {
  constructor({
    catalog = actionCatalog,
    schemas = actionSchemas,
    validator = new JsonSchemaValidator(),
  } = {}) {
    this.catalog = catalog;
    this.schemas = schemas;
    this.validator = validator;
  }

  validate(actionName, payload) {
    const action = this.catalog.get(actionName);
    if (!action) {
      throw new AppError('Action is not allowlisted', 403, {
        code: 'action_not_allowlisted',
        action: actionName,
      });
    }

    const schema = this.schemas[actionName];
    if (!schema) {
      throw new AppError('Action schema is not configured', 500, {
        code: 'action_schema_missing',
        action: actionName,
      });
    }

    const result = this.validator.validate(schema, payload || {});
    if (!result.valid) {
      throw new AppError('Action payload validation failed', 422, {
        code: 'action_payload_invalid',
        action: actionName,
        errors: result.errors,
      });
    }

    return Object.freeze({
      action,
      payload: Object.freeze({ ...(payload || {}) }),
    });
  }
}

module.exports = ActionValidatorService;
