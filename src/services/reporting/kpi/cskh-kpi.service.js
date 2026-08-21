/**
 * @fileoverview cskh-kpi.service - Provides cskh-kpi functionality.
 */
'use strict';

/**
 * CskhKpiService
 * Manages cskh kpi logic.
 */
class CskhKpiService {
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

module.exports = CskhKpiService;
