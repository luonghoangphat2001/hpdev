'use strict';

const eventCatalog = require('./ecommerce-event.catalog');
const { DTO_SCHEMA_VERSION } = require('../dto/common-dto.schemas');

const ecommerceWebhookEnvelopeSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://openclaw.hpdev.name.vn/schemas/v1/ecommerce-webhook-envelope.json',
  title: 'ecommerce-webhook-envelope',
  type: 'object',
  additionalProperties: false,
  required: ['event_id', 'schema_version', 'event', 'timestamp', 'data', 'changes'],
  properties: {
    event_id: {
      type: 'string',
      pattern: '^evt_[0-9a-f-]{36}$',
    },
    schema_version: { const: DTO_SCHEMA_VERSION },
    event: {
      type: 'string',
      enum: eventCatalog.list().map(({ name }) => name),
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
    },
    correlation_id: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
    },
    webhook_id: {
      type: ['string', 'number'],
    },
    data: {
      type: 'object',
    },
    changes: {
      type: 'object',
    },
  },
});

module.exports = ecommerceWebhookEnvelopeSchema;
