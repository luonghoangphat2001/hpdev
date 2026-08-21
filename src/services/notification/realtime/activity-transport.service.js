/**
 * @fileoverview activity-transport.service - Provides activity-transport functionality.
 */
'use strict';

/**
 * ActivityTransportService
 * Manages activity transport logic.
 */
class ActivityTransportService {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    this.subscribers = new Set();
  }

  /**
   * subscribe - Executes subscribe.
   * @param {*} callback - Input parameter.
   * @returns {*} Result of operation.
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * broadcastActivity - Executes broadcast activity.
   * @param {*} event - Input parameter.
   * @returns {*} Result of operation.
   */
  broadcastActivity(event) {
    const payload = Object.freeze({
      ...event,
      timestamp: new Date().toISOString(),
    });
    for (const callback of this.subscribers) {
      callback(payload);
    }
  }
}

module.exports = ActivityTransportService;
