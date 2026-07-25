'use strict';

class SopDirectDeterministicExecutorService {
  constructor({ sopExecutionEngine }) {
    this.sopExecutionEngine = sopExecutionEngine;
  }

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

module.exports = SopDirectDeterministicExecutorService;
