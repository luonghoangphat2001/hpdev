/**
 * @fileoverview latency-ux.service - Provides latency-ux functionality.
 */
'use strict';

/**
 * LatencyUxService
 * Manages latency ux logic.
 */
class LatencyUxService {
  /**
   * constructor - Executes constructor.
   * @param {*} realtimeActivityTransport - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ realtimeActivityTransport }) {
    this.realtimeActivityTransport = realtimeActivityTransport;
  }

  /**
   * getRealtimeProgress - Executes get realtime progress.
   * @param {*} workflowId - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = LatencyUxService;
