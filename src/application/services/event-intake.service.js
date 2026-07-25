'use strict';

const crypto = require('crypto');
const correlationConvention = require('../../contracts/identity/correlation-convention');
const EventNormalizerService = require('./event-normalizer.service');

class EventIntakeService {
  constructor({
    eventRepository,
    normalizer = new EventNormalizerService(),
    identifiers = correlationConvention,
    clock = () => new Date(),
  }) {
    this.eventRepository = eventRepository;
    this.normalizer = normalizer;
    this.identifiers = identifiers;
    this.clock = clock;
  }

  async accept(command) {
    const canonical = this.normalizer.normalize(command.payload);
    const rawBody = Buffer.isBuffer(command.rawBody)
      ? command.rawBody
      : Buffer.from(command.rawBody, 'utf8');
    const eventId = canonical.event_id;
    const correlationId = canonical.correlation_id
      || this.identifiers.createId('correlation');

    try {
      await this.eventRepository.create({
        eventId,
        schemaVersion: canonical.schema_version,
        eventType: canonical.event_type,
        source: canonical.source,
        occurredAt: new Date(canonical.occurred_at),
        receivedAt: this.clock(),
        correlationId,
        deliveryId: command.deliveryId,
        rawPayload: command.payload,
        payloadHash: crypto.createHash('sha256').update(rawBody).digest('hex'),
        signatureValid: true,
        signatureKeyId: command.keyId,
        status: 'received',
      });
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        throw error;
      }

      const existing = await this.eventRepository.findByDeliveryId(command.deliveryId)
        || await this.eventRepository.findByEventId(eventId);
      if (!existing) {
        throw error;
      }

      return Object.freeze({
        event_id: existing.event_id,
        correlation_id: existing.correlation_id,
        status: 'duplicate',
      });
    }

    return Object.freeze({
      event_id: eventId,
      correlation_id: correlationId,
      status: 'accepted',
    });
  }
}

module.exports = EventIntakeService;
