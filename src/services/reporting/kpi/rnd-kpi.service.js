/**
 * @fileoverview rnd-kpi.service - Provides rnd-kpi functionality.
 */
'use strict';

/**
 * RndKpiService
 * Manages rnd kpi logic.
 */
class RndKpiService {
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

module.exports = RndKpiService;
