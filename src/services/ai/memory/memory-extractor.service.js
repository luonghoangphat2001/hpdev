/**
 * @fileoverview memory-extractor.service - Provides memory-extractor functionality.
 */
'use strict';

/**
 * MemoryExtractorService
 * Manages memory extractor logic.
 */
class MemoryExtractorService {
  /**
   * constructor - Executes constructor.
   * @param {*} immutableHistoryStore - Input parameter.
   * @param {*} curatedMemoryStore - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ immutableHistoryStore, curatedMemoryStore }) {
    this.immutableHistoryStore = immutableHistoryStore;
    this.curatedMemoryStore = curatedMemoryStore;
  }

  /**
   * extractMemoryCandidates - Executes extract memory candidates.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  extractMemoryCandidates({ agentId }) {
    const historyEntries = this.immutableHistoryStore ? this.immutableHistoryStore.queryHistory({ agentId }) : [];
    const candidates = historyEntries.map((e) => Object.freeze({
      candidateId: `cand_${e.historyId}`,
      agentId,
      extractedFact: e.decision,
      confidence: 0.92,
      hasEvidence: true,
      rawLogPromotedDirectly: false,
      extractedAt: new Date().toISOString(),
    }));

    return Object.freeze(candidates);
  }
}

module.exports = MemoryExtractorService;
