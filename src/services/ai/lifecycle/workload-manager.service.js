/**
 * @fileoverview workload-manager.service - Provides workload-manager functionality.
 */
'use strict';

/**
 * WorkloadManagerService
 * Manages workload manager logic.
 */
class WorkloadManagerService {
  /**
   * constructor - Executes constructor.
   * @param {*} maxConcurrencyPerAgent - Input parameter.
   * @param {*} queueDepthLimit - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ maxConcurrencyPerAgent = 5, queueDepthLimit = 20 } = {}) {
    this.maxConcurrencyPerAgent = maxConcurrencyPerAgent;
    this.queueDepthLimit = queueDepthLimit;
    this.agentStats = new Map();
  }

  /**
   * getAgentStats - Executes get agent stats.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  getAgentStats(agentId) {
    if (!this.agentStats.has(agentId)) {
      this.agentStats.set(agentId, { activeCount: 0, queueDepth: 0 });
    }
    return this.agentStats.get(agentId);
  }

  /**
   * canAcceptTask - Executes can accept task.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  canAcceptTask(agentId) {
    const stats = this.getAgentStats(agentId);
    return stats.activeCount < this.maxConcurrencyPerAgent && stats.queueDepth < this.queueDepthLimit;
  }

  /**
   * trackTaskStart - Executes track task start.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  trackTaskStart(agentId) {
    const stats = this.getAgentStats(agentId);
    stats.activeCount += 1;
    if (stats.queueDepth > 0) stats.queueDepth -= 1;
  }

  /**
   * trackTaskEnd - Executes track task end.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  trackTaskEnd(agentId) {
    const stats = this.getAgentStats(agentId);
    if (stats.activeCount > 0) stats.activeCount -= 1;
  }

  /**
   * enqueueTask - Executes enqueue task.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  enqueueTask(agentId) {
    const stats = this.getAgentStats(agentId);
    if (stats.queueDepth >= this.queueDepthLimit) {
      throw new Error(`Queue depth limit reached for agent: ${agentId}`);
    }
    stats.queueDepth += 1;
  }

  /**
   * getSaturation - Executes get saturation.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  getSaturation(agentId) {
    const stats = this.getAgentStats(agentId);
    const concurrencyRatio = stats.activeCount / this.maxConcurrencyPerAgent;
    const queueRatio = stats.queueDepth / this.queueDepthLimit;
    return Object.freeze({
      agentId,
      concurrencyRatio,
      queueRatio,
      isSaturated: concurrencyRatio >= 0.8 || queueRatio >= 0.8,
    });
  }
}

module.exports = WorkloadManagerService;
