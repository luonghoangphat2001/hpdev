'use strict';

const CfoKpiService = require('../../../src/services/reporting/kpi/cfo-kpi.service');

describe('T073: CFO KPI Engine', () => {
  test('evaluates CFO KPI metrics', async () => {
    const kpiCollectorService = {
      collectKpi: jest.fn().mockResolvedValue({
        value: 0.68,
        target: 0.65,
        isTargetMet: true,
      }),
    };

    const engine = new CfoKpiService({ kpiCollectorService });
    const res = await engine.evaluateKpi({ date: '2026-07-25' });

    expect(res.agent).toBe('dan_cfo');
    expect(res.metrics.grossMargin).toBe(0.68);
    expect(res.metrics.isTargetMet).toBe(true);
  });
});
