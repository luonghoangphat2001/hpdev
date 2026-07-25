'use strict';

class RealtimeLogCollectorBufferService {
  constructor({ logSchemaService }) {
    this.logSchemaService = logSchemaService;
    this.buffer = [];
  }

  ingestLog(logEntry) {
    const entry = Object.freeze({
      ...logEntry,
      ingestedAt: new Date().toISOString(),
    });
    this.buffer.push(entry);
    return Object.freeze({ ingested: true, bufferLength: this.buffer.length });
  }

  flushBuffer() {
    const logs = [...this.buffer];
    this.buffer = [];
    return Object.freeze(logs);
  }
}

module.exports = RealtimeLogCollectorBufferService;
