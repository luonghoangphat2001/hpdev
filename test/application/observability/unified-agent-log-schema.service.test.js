'use strict';

const UnifiedAgentLogSchemaService = require('../../../src/application/services/observability/unified-agent-log-schema.service');

describe('T161: Unified Agent Event/Log Schema Service', () => {
  test('creates structured log entry adhering to schema version 1.0.0', () => {
    const service = new UnifiedAgentLogSchemaService();
    const entry = service.createLogEntry({
      agentId: 'dan_ops',
      workflowId: 'wf_555',
      taskId: 'task_12',
      step: 'INVENTORY_QUERY',
      costUSD: 0.002,
    });

    expect(entry.schemaVersion).toBe('1.0.0');
    expect(entry.agentId).toBe('dan_ops');
    expect(entry.step).toBe('INVENTORY_QUERY');
  });
});
