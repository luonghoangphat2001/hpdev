/**
 * @fileoverview replay.service - Provides replay functionality.
 */
'use strict';

const crypto = require('crypto');
const AppError = require('@utils/errors/app.error');

/**
 * ReplayService
 * Manages replay logic.
 */
class ReplayService {
  constructor({
    eventRepository,
    simulator,
    dispatcher = null,
    allowedOperatorIds,
    productionEnabled = false,
    idFactory = () => `rpl_${crypto.randomUUID()}`,
  }) {
    this.eventRepository = eventRepository;
    this.simulator = simulator;
    this.dispatcher = dispatcher;
    this.allowedOperatorIds = new Set(allowedOperatorIds || []);
    this.productionEnabled = productionEnabled;
    this.idFactory = idFactory;
  }

  /**
   * replay - Asynchronously executes replay.
   * @param {*} eventId - Input parameter.
   * @param {*} dryRun - Input parameter.
   * @param {*} actorId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async replay({ eventId, dryRun = true, actorId }) {
    if (!this.allowedOperatorIds.has(String(actorId))) {
      throw new AppError('Operator is not authorized', 403);
    }
    const event = await this.eventRepository.findByEventId(eventId);
    if (!event) throw new AppError('Event not found', 404);
    const replayId = this.idFactory();
    const payload = {
      replayId,
      originalEventId: event.event_id,
      eventType: event.event_type,
      correlationId: event.correlation_id,
      payload: typeof event.raw_payload === 'string'
        ? JSON.parse(event.raw_payload)
        : event.raw_payload,
      actorId,
    };
    if (dryRun) {
      const simulation = await this.simulator.simulate({
        ...payload,
        writesAllowed: false,
      });
      return Object.freeze({ replayId, mode: 'dry_run', simulation });
    }
    if (!this.productionEnabled || !this.dispatcher) {
      throw new AppError('Live replay is disabled by release gate', 409);
    }
    if (!['failed', 'dead_letter'].includes(event.status)) {
      throw new AppError('Only failed events can be replayed live', 409);
    }
    const receipt = await this.dispatcher.dispatch(payload);
    return Object.freeze({ replayId, mode: 'live', receipt });
  }
}

module.exports = ReplayService;
