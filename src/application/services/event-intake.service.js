'use strict';

const crypto = require('crypto');
const eventCatalog = require('../../contracts/events/ecommerce-event.catalog');
const correlationConvention = require('../../contracts/identity/correlation-convention');
const { AppError } = require('../../middlewares/error.middleware');

class EventIntakeService {
  constructor({
    eventRepository,
    catalog = eventCatalog,
    identifiers = correlationConvention,
    clock = () => new Date(),
  }) {
    this.eventRepository = eventRepository;
    this.catalog = catalog;
    this.identifiers = identifiers;
    this.clock = clock;
  }

  async accept(command) {
    const eventDefinition = this.catalog.get(command.payload.event);
    if (!eventDefinition) {
      throw new AppError('Unsupported Ecommerce event', 422, {
        code: 'unsupported_event',
        event: command.payload.event,
      });
    }

    const rawBody = Buffer.isBuffer(command.rawBody)
      ? command.rawBody
      : Buffer.from(command.rawBody, 'utf8');
    const eventId = command.payload.event_id;
    const correlationId = command.payload.correlation_id
      || this.identifiers.createId('correlation');

    await this.eventRepository.create({
      eventId,
      schemaVersion: command.payload.schema_version,
      eventType: eventDefinition.name,
      source: 'ecommerce',
      occurredAt: new Date(command.payload.timestamp),
      receivedAt: this.clock(),
      correlationId,
      deliveryId: command.deliveryId,
      rawPayload: command.payload,
      payloadHash: crypto.createHash('sha256').update(rawBody).digest('hex'),
      signatureValid: true,
      signatureKeyId: command.keyId,
      status: 'received',
    });

    return Object.freeze({
      event_id: eventId,
      correlation_id: correlationId,
      status: 'accepted',
    });
  }
}

module.exports = EventIntakeService;
