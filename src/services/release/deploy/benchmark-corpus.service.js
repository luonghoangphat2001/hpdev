/**
 * @fileoverview benchmark-corpus.service - Provides benchmark-corpus functionality.
 */
'use strict';

/**
 * BenchmarkCorpusService
 * Manages benchmark corpus logic.
 */
class BenchmarkCorpusService {
  /**
   * getBenchmarkCorpus - Executes get benchmark corpus.
   * @returns {*} Result of operation.
   */
  getBenchmarkCorpus() {
    return Object.freeze([
      Object.freeze({ fixtureId: 'bench_low_1', riskLevel: 'LOW', agentId: 'dan_ops', caseType: 'KNOWN' }),
      Object.freeze({ fixtureId: 'bench_med_1', riskLevel: 'MEDIUM', agentId: 'dan_cfo', caseType: 'NOVEL' }),
      Object.freeze({ fixtureId: 'bench_high_1', riskLevel: 'HIGH', agentId: 'dan_rnd', caseType: 'FAILURE' }),
      Object.freeze({ fixtureId: 'bench_med_2', riskLevel: 'MEDIUM', agentId: 'dan_cskh', caseType: 'KNOWN' }),
      Object.freeze({ fixtureId: 'bench_high_2', riskLevel: 'HIGH', agentId: 'dan_logistics', caseType: 'KNOWN' }),
    ]);
  }
}

module.exports = BenchmarkCorpusService;
