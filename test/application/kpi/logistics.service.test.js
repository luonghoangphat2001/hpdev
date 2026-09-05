'use strict';

const LogisticsKpiService = require('@services/reporting/kpi/logistics-kpi.service');

describe('T072: Logistics KPI Engine', () => {
  test('evaluates Logistics KPI metrics', async () => {
    const kpiCollectorService = {
      collectKpi: jest.fn().mockResolvedValue({
        value: 0.01,
        target: 0.02,
        isTargetMet: true,
      }),
    };

    const engine = new LogisticsKpiService({ kpiCollectorService });
    const res = await engine.evaluateKpi({ date: '2026-07-25' });

    expect(res.agent).toBe('dan_logistics');
    expect(res.metrics.stockoutRate).toBe(0.01);
    expect(res.metrics.isTargetMet).toBe(true);
  });
});
