'use strict';

class RealtimeActivityTransportService {
  constructor() {
    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

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

module.exports = RealtimeActivityTransportService;
