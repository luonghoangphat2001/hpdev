'use strict';

const LogisticsKpiEngine = require('../../../src/application/services/kpi/logistics-kpi-engine.service');

describe('T072: Logistics KPI Engine', () => {
  test('evaluates Logistics KPI metrics', async () => {
    const kpiCollectorService = {
      collectKpi: jest.fn().mockResolvedValue({
        value: 0.01,
        target: 0.02,
        isTargetMet: true,
      }),
    };

    const engine = new LogisticsKpiEngine({ kpiCollectorService });
    const res = await engine.evaluateKpi({ date: '2026-07-25' });

    expect(res.agent).toBe('dan_logistics');
    expect(res.metrics.stockoutRate).toBe(0.01);
    expect(res.metrics.isTargetMet).toBe(true);
  });
});
