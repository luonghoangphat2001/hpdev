'use strict';

const ecommerceEnvelopeSchema = require('../../../contracts/events/ecommerce-webhook-envelope.schema');
const { eventSchema } = require('../../../contracts/dto/common-dto.schemas');
const JsonSchemaValidator = require('../../../infrastructure/validation/json-schema.validator');
const { AppError } = require('../../../middlewares/error.middleware');

class EventNormalizerService {
  constructor(validator = new JsonSchemaValidator()) {
    this.validator = validator;
  }

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

module.exports = EventNormalizerService;
