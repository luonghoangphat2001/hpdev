'use strict';

const ImmutableAgentHistoryStoreService = require('../../../src/application/services/memory/immutable-agent-history-store.service');

describe('T165: Immutable Agent History Store/Query Service', () => {
  test('records and queries immutable history entries by agent and time', () => {
    const service = new ImmutableAgentHistoryStoreService();
    const entry = service.recordHistoryEntry({
      agentId: 'dan_ops',
      taskId: 'task_88',
      decision: 'REORDER_INVENTORY',
      action: 'POST_SUPPLIER_PO',
      outcome: 'PO_CREATED',
      agentVersion: 'v1.4.0',
    });

    expect(entry.historyId).toBeDefined();
    const queried = service.queryHistory({ agentId: 'dan_ops' });
    expect(queried.length).toBe(1);
    expect(queried[0].action).toBe('POST_SUPPLIER_PO');
  });
});
