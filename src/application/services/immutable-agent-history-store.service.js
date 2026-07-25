'use strict';

class ImmutableAgentHistoryStoreService {
  constructor() {
    this.historyStore = [];
  }

  recordHistoryEntry({ agentId, taskId, decision, action, outcome, agentVersion }) {
    const entry = Object.freeze({
      historyId: `hist_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      taskId,
      decision,
      action,
      outcome,
      agentVersion,
      recordedAt: new Date().toISOString(),
    });

    this.historyStore.push(entry);
    return entry;
  }

  queryHistory({ agentId }) {
    return Object.freeze(this.historyStore.filter((e) => e.agentId === agentId));
  }
}

module.exports = ImmutableAgentHistoryStoreService;
