/**
 * @fileoverview log-schema.service - Provides log-schema functionality.
 */
'use strict';

/**
 * LogSchemaService
 * Manages log schema logic.
 */
class LogSchemaService {
  /**
   * createLogEntry - Executes create log entry.
   * @param {*} agentId - Input parameter.
   * @param {*} workflowId - Input parameter.
   * @param {*} taskId - Input parameter.
   * @param {*} step - Input parameter.
   * @param {*} level - Input parameter.
   * @param {*} type - Input parameter.
   * @param {*} costUSD - Input parameter.
   * @param {*} error - Input parameter.
   * @returns {*} Result of operation.
   */
  createLogEntry({ agentId, workflowId, taskId, step, level = 'INFO', type = 'EXECUTION', costUSD = 0, error = null }) {
    return Object.freeze({
      schemaVersion: '1.0.0',
      agentId,
      workflowId,
      taskId,
      step,
      level,
      type,
      costUSD,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = LogSchemaService;
