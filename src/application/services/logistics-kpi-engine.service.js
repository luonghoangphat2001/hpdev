'use strict';

class LogisticsKpiEngine {
  constructor({ kpiCollectorService }) {
    this.kpiCollectorService = kpiCollectorService;
  }

  async evaluateKpi({ date }) {
    const stockoutRate = await this.kpiCollectorService.collectKpi({
      kpiKey: 'logistics.stockout_rate',
      timeframe: 'daily',
      date,
    });

    return Object.freeze({
      agent: 'dan_logistics',
      date,
      metrics: {
        stockoutRate: stockoutRate.value,
        target: stockoutRate.target,
        isTargetMet: stockoutRate.value <= stockoutRate.target,
      },
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = LogisticsKpiEngine;
