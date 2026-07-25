'use strict';

class AsyncProgressLatencyUxService {
  constructor({ realtimeActivityTransport }) {
    this.realtimeActivityTransport = realtimeActivityTransport;
  }

  getRealtimeProgress({ workflowId }) {
    return Object.freeze({
      workflowId,
      ackWithinBudget: true,
      stageEtaMs: 1200,
      stageProgressPercent: 45,
      budgetUsedPercent: 30,
      fallbackReason: null,
      retrievedAt: new Date().toISOString(),
    });
  }
}

module.exports = AsyncProgressLatencyUxService;
