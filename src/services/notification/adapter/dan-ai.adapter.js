/**
 * @fileoverview dan-ai.adapter - Provides dan-ai functionality.
 */
'use strict';

const NotificationGateway = require('../realtime/notification.gateway');

const ALLOWED_SEVERITIES = new Set(['info', 'success', 'warning', 'critical']);

/**
 * DanAiAdapter
 * Manages dan ai adapter logic.
 */
class DanAiAdapter extends NotificationGateway {
  #client;

  /**
   * constructor - Executes constructor.
   * @param {*} client - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(client) {
    super();
    if (!client || typeof client.sendNotification !== 'function') {
      throw new TypeError('DanAiAdapter requires a notification client');
    }
    this.#client = client;
  }

  /**
   * notify - Asynchronously executes notify.
   * @param {*} input - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async notify(input = {}) {
    const notification = this.#normalize(input);
    return this.#client.sendNotification(notification);
  }

  #normalize(input) {
    const idempotencyKey = String(input.idempotencyKey || '').trim();
    const title = String(input.title || '').trim();
    const message = String(input.message || '').trim();
    const severity = String(input.severity || 'info').toLowerCase();

    if (!idempotencyKey) throw new TypeError('idempotencyKey is required');
    if (!title) throw new TypeError('title is required');
    if (!message) throw new TypeError('message is required');
    if (!ALLOWED_SEVERITIES.has(severity)) {
      throw new TypeError('Unsupported notification severity');
    }

    return {
      idempotencyKey,
      title,
      message,
      severity,
      source: 'openclaw',
      ...(input.channelId ? { channelId: String(input.channelId) } : {}),
    };
  }
}

module.exports = DanAiAdapter;
