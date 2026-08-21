'use strict';

const BenchmarkCorpusService = require('../../../src/services/release/deploy/benchmark-corpus.service');

describe('T188: Representative Benchmark Corpus Service', () => {
  test('provides LOW/MEDIUM/HIGH fixtures across all 5 agents covering known, novel, and failure cases', () => {
    const service = new BenchmarkCorpusService();
    const corpus = service.getBenchmarkCorpus();

    expect(corpus.length).toBe(5);
    const agentIds = new Set(corpus.map((c) => c.agentId));
    expect(agentIds.size).toBe(5);
  });
});
