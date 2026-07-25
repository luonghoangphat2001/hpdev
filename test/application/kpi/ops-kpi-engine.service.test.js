'use strict';

const OpsKpiEngine = require('../../../src/application/services/kpi/ops-kpi-engine.service');

describe('T074: Ops KPI Engine', () => {
  test('evaluates Ops KPI metrics', async () => {
    const kpiCollectorService = {
      collectKpi: jest.fn().mockResolvedValue({
        value: 0.96,
        target: 0.95,
        isTargetMet: true,
      }),
    };

    const engine = new OpsKpiEngine({ kpiCollectorService });
    const res = await engine.evaluateKpi({ date: '2026-07-25' });

    expect(res.agent).toBe('dan_ops');
    expect(res.metrics.slaComplianceRate).toBe(0.96);
    expect(res.metrics.isTargetMet).toBe(true);
  });
});
