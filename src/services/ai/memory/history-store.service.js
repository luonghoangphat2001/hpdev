/**
 * @fileoverview history-store.service - Provides history-store functionality.
 */
'use strict';

/**
 * HistoryStoreService
 * Manages history store logic.
 */
class HistoryStoreService {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    this.historyStore = [];
  }

  /**
   * recordHistoryEntry - Executes record history entry.
   * @param {*} agentId - Input parameter.
   * @param {*} taskId - Input parameter.
   * @param {*} decision - Input parameter.
   * @param {*} action - Input parameter.
   * @param {*} outcome - Input parameter.
   * @param {*} agentVersion - Input parameter.
   * @returns {*} Result of operation.
   */
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

  /**
   * queryHistory - Executes query history.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  queryHistory({ agentId }) {
    return Object.freeze(this.historyStore.filter((e) => e.agentId === agentId));
  }
}

module.exports = HistoryStoreService;
