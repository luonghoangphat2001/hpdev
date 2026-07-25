'use strict';

class UnifiedAgentLogSchemaService {
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

module.exports = UnifiedAgentLogSchemaService;
