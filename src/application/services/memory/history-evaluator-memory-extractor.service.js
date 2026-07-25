'use strict';

class HistoryEvaluatorMemoryExtractorService {
  constructor({ immutableHistoryStore, curatedMemoryStore }) {
    this.immutableHistoryStore = immutableHistoryStore;
    this.curatedMemoryStore = curatedMemoryStore;
  }

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

module.exports = HistoryEvaluatorMemoryExtractorService;
