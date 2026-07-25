'use strict';

class RndKpiEngine {
  constructor({ kpiCollectorService }) {
    this.kpiCollectorService = kpiCollectorService;
  }

  async evaluateKpi({ date }) {
    const proposalRate = await this.kpiCollectorService.collectKpi({
      kpiKey: 'rnd.proposal_acceptance_rate',
      timeframe: 'weekly',
      date,
    });

    return Object.freeze({
      agent: 'dan_rnd',
      date,
      metrics: {
        proposalAcceptanceRate: proposalRate.value,
        target: proposalRate.target,
        isTargetMet: proposalRate.isTargetMet,
      },
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = RndKpiEngine;
