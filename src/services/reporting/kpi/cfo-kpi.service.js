/**
 * @fileoverview cfo-kpi.service - Provides cfo-kpi functionality.
 */
'use strict';

/**
 * CfoKpiService
 * Manages cfo kpi logic.
 */
class CfoKpiService {
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

module.exports = CfoKpiService;
