'use strict';

const MonitorReadModelAdapter = require('../../../src/application/adapters/monitor-read-model.adapter');

describe('T122: OpenClaw Monitor Read-Model API Adapter Service', () => {
  test('fetches versioned overview read model', async () => {
    const adapter = new MonitorReadModelAdapter({});
    const overview = await adapter.getOverviewReadModel();

    expect(overview.version).toBe('1.0.0');
    expect(overview.activeAgentsCount).toBe(5);
  });
});
