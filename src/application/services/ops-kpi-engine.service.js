'use strict';

class OpsKpiEngine {
  constructor({ kpiCollectorService }) {
    this.kpiCollectorService = kpiCollectorService;
  }

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

module.exports = OpsKpiEngine;
