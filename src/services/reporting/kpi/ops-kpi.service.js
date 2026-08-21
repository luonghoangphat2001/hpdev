/**
 * @fileoverview ops-kpi.service - Provides ops-kpi functionality.
 */
'use strict';

/**
 * OpsKpiService
 * Manages ops kpi logic.
 */
class OpsKpiService {
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
    const slaRate = await this.kpiCollectorService.collectKpi({
      kpiKey: 'ops.sla_compliance_rate',
      timeframe: 'daily',
      date,
    });

    return Object.freeze({
      agent: 'dan_ops',
      date,
      metrics: {
        slaComplianceRate: slaRate.value,
        target: slaRate.target,
        isTargetMet: slaRate.value >= slaRate.target,
      },
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = OpsKpiService;
