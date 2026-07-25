'use strict';

class CskhKpiEngine {
  constructor({ kpiCollectorService }) {
    this.kpiCollectorService = kpiCollectorService;
  }

  async evaluateKpi({ date }) {
    const csat = await this.kpiCollectorService.collectKpi({
      kpiKey: 'cskh.customer_satisfaction_score',
      timeframe: 'daily',
      date,
    });

    return Object.freeze({
      agent: 'dan_cskh',
      date,
      metrics: {
        customerSatisfactionScore: csat.value,
        target: csat.target,
        isTargetMet: csat.value >= csat.target,
      },
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = CskhKpiEngine;
