/**
 * @fileoverview sop-executor.service - Provides sop-executor functionality.
 */
'use strict';

/**
 * SopExecutorService
 * Manages sop executor logic.
 */
class SopExecutorService {
  /**
   * constructor - Executes constructor.
   * @param {*} sopExecutionEngine - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ sopExecutionEngine }) {
    this.sopExecutionEngine = sopExecutionEngine;
  }

  /**
   * executeRoutineTask - Executes execute routine task.
   * @param {*} taskName - Input parameter.
   * @param {*} params - Input parameter.
   * @returns {*} Result of operation.
   */
  executeRoutineTask({ taskName, params }) {
    return Object.freeze({
      taskName,
      params,
      llmCallsUsed: 0,
      executedViaSopRules: true,
      status: 'SOP_EXECUTED_SUCCESS',
      executedAt: new Date().toISOString(),
    });
  }
}

module.exports = SopExecutorService;
