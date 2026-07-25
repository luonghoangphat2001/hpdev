'use strict';

const NotificationGateway = require('../ports/notification.gateway');

const ALLOWED_SEVERITIES = new Set(['info', 'success', 'warning', 'critical']);

class DanAiNotificationAdapter extends NotificationGateway {
  #client;

  constructor(client) {
    super();
    if (!client || typeof client.sendNotification !== 'function') {
      throw new TypeError('DanAiNotificationAdapter requires a notification client');
    }
    this.#client = client;
  }

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

module.exports = DanAiNotificationAdapter;
