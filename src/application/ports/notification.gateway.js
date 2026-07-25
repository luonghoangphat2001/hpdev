'use strict';

/**
 * Output port for CEO-facing operational notifications.
 * Implementations decide the transport; orchestration code never imports Discord.
 */
class NotificationGateway {
  async notify(_notification) {
    throw new Error('NotificationGateway.notify must be implemented');
  }
}

module.exports = NotificationGateway;
