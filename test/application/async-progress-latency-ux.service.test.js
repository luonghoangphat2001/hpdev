'use strict';

const AsyncProgressLatencyUxService = require('../../src/application/services/async-progress-latency-ux.service');

describe('T185: Async Progress/Latency UX in Monitor Service', () => {
  test('provides realtime progress, stage ETA, budget usage, and ACK within budget', () => {
    const service = new AsyncProgressLatencyUxService({});
    const prog = service.getRealtimeProgress({ workflowId: 'wf_777' });

    expect(prog.ackWithinBudget).toBe(true);
    expect(prog.stageProgressPercent).toBe(45);
    expect(prog.budgetUsedPercent).toBe(30);
  });
});
