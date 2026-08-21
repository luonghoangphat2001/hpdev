/**
 * @fileoverview logistics-kpi.service - Provides logistics-kpi functionality.
 */
'use strict';

/**
 * LogisticsKpiService
 * Manages logistics kpi logic.
 */
class LogisticsKpiService {
  /**
   * constructor - Executes constructor.
   * @param {*} kpiCollectorService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ kpiCollectorService }) {
    this.kpiCollectorService = kpiCollectorService;
  }

  /**
   * evaluateKpi - Asynchronously executes evaluate kpi.
   * @param {*} date - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

module.exports = LogisticsKpiService;
