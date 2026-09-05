'use strict';

const LatencyUxService = require('@services/reporting/dashboard/latency-ux.service');

describe('T185: Async Progress/Latency UX in Monitor Service', () => {
  test('provides realtime progress, stage ETA, budget usage, and ACK within budget', () => {
    const service = new LatencyUxService({});
    const prog = service.getRealtimeProgress({ workflowId: 'wf_777' });

    expect(prog.ackWithinBudget).toBe(true);
    expect(prog.stageProgressPercent).toBe(45);
    expect(prog.budgetUsedPercent).toBe(30);
  });
});
