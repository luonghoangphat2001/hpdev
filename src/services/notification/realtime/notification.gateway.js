/**
 * @fileoverview notification.gateway - Provides notification functionality.
 */
'use strict';

/**
 * Output port for CEO-facing operational notifications.
 * Implementations decide the transport; orchestration code never imports Discord.
 */
class NotificationGateway {
  /**
   * notify - Asynchronously executes notify.
   * @param {*} _notification - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async notify(_notification) {
    throw new Error('NotificationGateway.notify must be implemented');
  }
}

module.exports = NotificationGateway;
