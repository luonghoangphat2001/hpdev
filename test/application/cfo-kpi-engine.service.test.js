'use strict';

const CfoKpiEngine = require('../../src/application/services/cfo-kpi-engine.service');

describe('T073: CFO KPI Engine', () => {
  test('evaluates CFO KPI metrics', async () => {
    const kpiCollectorService = {
      collectKpi: jest.fn().mockResolvedValue({
        value: 0.68,
        target: 0.65,
        isTargetMet: true,
      }),
    };

    const engine = new CfoKpiEngine({ kpiCollectorService });
    const res = await engine.evaluateKpi({ date: '2026-07-25' });

    expect(res.agent).toBe('dan_cfo');
    expect(res.metrics.grossMargin).toBe(0.68);
    expect(res.metrics.isTargetMet).toBe(true);
  });
});
