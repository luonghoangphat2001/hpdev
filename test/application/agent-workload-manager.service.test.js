'use strict';

const AgentWorkloadManagerService = require('../../src/application/services/agent-workload-manager.service');

describe('T068: Agent Workload/Capacity Manager', () => {
  test('tracks agent concurrency and queue depth', () => {
    const manager = new AgentWorkloadManagerService({ maxConcurrencyPerAgent: 2, queueDepthLimit: 5 });

    expect(manager.canAcceptTask('dan_ops')).toBe(true);
    manager.trackTaskStart('dan_ops');
    manager.trackTaskStart('dan_ops');
    expect(manager.canAcceptTask('dan_ops')).toBe(false);

    const saturation = manager.getSaturation('dan_ops');
    expect(saturation.isSaturated).toBe(true);

    manager.trackTaskEnd('dan_ops');
    expect(manager.canAcceptTask('dan_ops')).toBe(true);
  });
});
