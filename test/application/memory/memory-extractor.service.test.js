'use strict';

const MemoryExtractorService = require('../../../src/services/ai/memory/memory-extractor.service');

describe('T167: History Evaluator and Memory-Candidate Extractor Service', () => {
  test('extracts memory candidates only with evidence and without promoting raw logs directly', () => {
    const mockStore = {
      queryHistory: jest.fn().mockReturnValue([
        { historyId: 'h1', decision: 'PREFER_EXPRESS_LOGISTICS' },
      ]),
    };
    const service = new MemoryExtractorService({ immutableHistoryStore: mockStore });
    const candidates = service.extractMemoryCandidates({ agentId: 'dan_logistics' });

    expect(candidates.length).toBe(1);
    expect(candidates[0].hasEvidence).toBe(true);
    expect(candidates[0].rawLogPromotedDirectly).toBe(false);
  });
});
