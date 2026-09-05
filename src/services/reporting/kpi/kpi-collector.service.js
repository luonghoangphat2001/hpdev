/**
 * @fileoverview kpi-collector.service - Provides kpi-collector functionality.
 */
'use strict';

const { getKpiDefinition } = require('@schemas/reporting/kpi.catalog');

/**
 * KpiCollectorService
 * Manages kpi collector logic.
 */
class KpiCollectorService {
  /**
   * constructor - Executes constructor.
   * @param {*} ssotClient - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ ssotClient }) {
    this.ssotClient = ssotClient;
  }

  /**
   * collectKpi - Asynchronously executes collect kpi.
   * @param {*} kpiKey - Input parameter.
   * @param {*} timeframe - Input parameter.
   * @param {*} date - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async collectKpi({ kpiKey, timeframe = 'daily', date }) {
    const def = getKpiDefinition(kpiKey);
    const endpoint = `/api/v1/analytics/kpi?key=${encodeURIComponent(kpiKey)}&timeframe=${timeframe}&date=${date}`;

    let result;
    try {
      result = await this.ssotClient.get(endpoint);
    } catch (err) {
      result = { value: 0, degraded: true, error: err.message };
    }

    const value = result.value ?? 0;
    const isTargetMet = value >= def.target;

    return Object.freeze({
      kpiKey,
      name: def.name,
      ownerAgent: def.ownerAgent,
      timeframe,
      date,
      value,
      target: def.target,
      isTargetMet,
      degraded: !!result.degraded,
      collectedAt: new Date().toISOString(),
    });
  }
}

module.exports = KpiCollectorService;
