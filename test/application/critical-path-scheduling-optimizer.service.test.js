'use strict';

const CriticalPathSchedulingOptimizerService = require('../../src/application/services/critical-path-scheduling-optimizer.service');

describe('T184: Critical-Path/Parallel Scheduling Optimizer Service', () => {
  test('schedules independent tasks in parallel while respecting critical path and fan-out limits', () => {
    const service = new CriticalPathSchedulingOptimizerService({});
    const res = service.scheduleTasks({ taskGraph: [], maxFanOut: 3 });

    expect(res.criticalPathIdentified).toBe(true);
    expect(res.parallelExecutionAllowed).toBe(true);
    expect(res.maxFanOutLimit).toBe(3);
    expect(res.scheduledBatches.length).toBe(2);
  });
});
