/**
 * @fileoverview log-collector.service - Provides log-collector functionality.
 */
'use strict';

/**
 * LogCollectorService
 * Manages log collector logic.
 */
class LogCollectorService {
  /**
   * constructor - Executes constructor.
   * @param {*} logSchemaService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ logSchemaService }) {
    this.logSchemaService = logSchemaService;
    this.buffer = [];
  }

  /**
   * ingestLog - Executes ingest log.
   * @param {*} logEntry - Input parameter.
   * @returns {*} Result of operation.
   */
  ingestLog(logEntry) {
    const entry = Object.freeze({
      ...logEntry,
      ingestedAt: new Date().toISOString(),
    });
    this.buffer.push(entry);
    return Object.freeze({ ingested: true, bufferLength: this.buffer.length });
  }

  /**
   * flushBuffer - Executes flush buffer.
   * @returns {*} Result of operation.
   */
  flushBuffer() {
    const logs = [...this.buffer];
    this.buffer = [];
    return Object.freeze(logs);
  }
}

module.exports = LogCollectorService;
