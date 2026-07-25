'use strict';

class AgentWorkloadManagerService {
  constructor({ maxConcurrencyPerAgent = 5, queueDepthLimit = 20 } = {}) {
    this.maxConcurrencyPerAgent = maxConcurrencyPerAgent;
    this.queueDepthLimit = queueDepthLimit;
    this.agentStats = new Map();
  }

  getAgentStats(agentId) {
    if (!this.agentStats.has(agentId)) {
      this.agentStats.set(agentId, { activeCount: 0, queueDepth: 0 });
    }
    return this.agentStats.get(agentId);
  }

  canAcceptTask(agentId) {
    const stats = this.getAgentStats(agentId);
    return stats.activeCount < this.maxConcurrencyPerAgent && stats.queueDepth < this.queueDepthLimit;
  }

  trackTaskStart(agentId) {
    const stats = this.getAgentStats(agentId);
    stats.activeCount += 1;
    if (stats.queueDepth > 0) stats.queueDepth -= 1;
  }

  trackTaskEnd(agentId) {
    const stats = this.getAgentStats(agentId);
    if (stats.activeCount > 0) stats.activeCount -= 1;
  }

  enqueueTask(agentId) {
    const stats = this.getAgentStats(agentId);
    if (stats.queueDepth >= this.queueDepthLimit) {
      throw new Error(`Queue depth limit reached for agent: ${agentId}`);
    }
    stats.queueDepth += 1;
  }

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

module.exports = AgentWorkloadManagerService;
