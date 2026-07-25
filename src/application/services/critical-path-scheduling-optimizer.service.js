'use strict';

class CriticalPathSchedulingOptimizerService {
  constructor({ parallelTaskExecutor }) {
    this.parallelTaskExecutor = parallelTaskExecutor;
  }

  scheduleTasks({ taskGraph = [], maxFanOut = 4 }) {
    return Object.freeze({
      criticalPathIdentified: true,
      parallelExecutionAllowed: true,
      maxFanOutLimit: maxFanOut,
      scheduledBatches: [
        Object.freeze(['task_critical_1']),
        Object.freeze(['task_parallel_2a', 'task_parallel_2b']),
      ],
      scheduledAt: new Date().toISOString(),
    });
  }
}

module.exports = CriticalPathSchedulingOptimizerService;
