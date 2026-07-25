'use strict';

class CfoKpiEngine {
  constructor({ kpiCollectorService }) {
    this.kpiCollectorService = kpiCollectorService;
  }

  async evaluateKpi({ date }) {
    const grossMargin = await this.kpiCollectorService.collectKpi({
      kpiKey: 'cfo.gross_margin',
      timeframe: 'daily',
      date,
    });

    return Object.freeze({
      agent: 'dan_cfo',
      date,
      metrics: {
        grossMargin: grossMargin.value,
        target: grossMargin.target,
        isTargetMet: grossMargin.value >= grossMargin.target,
      },
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = CfoKpiEngine;
