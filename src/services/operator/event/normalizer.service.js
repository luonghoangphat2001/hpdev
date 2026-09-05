/**
 * @fileoverview normalizer.service - Provides normalizer functionality.
 */
'use strict';

const ecommerceEnvelopeSchema = require('@schemas/events/webhook.schema');
const BaseSchema = require('@schemas/BaseSchema');
const eventSchema = BaseSchema.eventSchema;
const JsonSchemaValidator = require('@utils/json-schema.validator');
const AppError = require('@utils/errors/app.error');

/**
 * NormalizerService
 * Manages normalizer logic.
 */
class NormalizerService {
  constructor(validator = new JsonSchemaValidator()) {
    this.validator = validator;
  }

  /**
   * normalize - Executes normalize.
   * @param {*} envelope - Input parameter.
   * @returns {*} Result of operation.
   */
  normalize(envelope) {
    this.assertValid(ecommerceEnvelopeSchema, envelope, 'event_schema_invalid');

    const canonical = {
      schema_version: envelope.schema_version,
      event_id: envelope.event_id,
      event_type: envelope.event,
      occurred_at: envelope.timestamp,
      source: 'ecommerce',
      payload: {
        data: envelope.data,
        changes: envelope.changes,
        ...(envelope.webhook_id === undefined
          ? {}
          : { webhook_id: String(envelope.webhook_id) }),
      },
      ...(envelope.correlation_id
        ? { correlation_id: envelope.correlation_id }
        : {}),
    };

    this.assertValid(eventSchema, canonical, 'canonical_event_invalid');
    return Object.freeze(canonical);
  }

  /**
   * assertValid - Executes assert valid.
   * @param {*} schema - Input parameter.
   * @param {*} value - Input parameter.
   * @param {*} code - Input parameter.
   * @returns {*} Result of operation.
   */
  assertValid(schema, value, code) {
    const result = this.validator.validate(schema, value);
    if (!result.valid) {
      throw new AppError('Event schema validation failed', 422, {
        code,
        errors: result.errors,
      });
    }
  }
}

module.exports = NormalizerService;
