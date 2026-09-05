'use strict';

const CskhKpiService = require('@services/reporting/kpi/cskh-kpi.service');

describe('T075: CSKH KPI Engine', () => {
  test('evaluates CSKH KPI metrics', async () => {
    const kpiCollectorService = {
      collectKpi: jest.fn().mockResolvedValue({
        value: 4.8,
        target: 4.5,
        isTargetMet: true,
      }),
    };

    const engine = new CskhKpiService({ kpiCollectorService });
    const res = await engine.evaluateKpi({ date: '2026-07-25' });

    expect(res.agent).toBe('dan_cskh');
    expect(res.metrics.customerSatisfactionScore).toBe(4.8);
    expect(res.metrics.isTargetMet).toBe(true);
  });
});
