'use strict';

const RndKpiEngine = require('../../../src/application/services/kpi/rnd-kpi-engine.service');

describe('T071: R&D KPI Engine', () => {
  test('evaluates R&D KPI metrics', async () => {
    const kpiCollectorService = {
      collectKpi: jest.fn().mockResolvedValue({
        value: 0.85,
        target: 0.8,
        isTargetMet: true,
      }),
    };

    const engine = new RndKpiEngine({ kpiCollectorService });
    const res = await engine.evaluateKpi({ date: '2026-07-25' });

    expect(res.agent).toBe('dan_rnd');
    expect(res.metrics.proposalAcceptanceRate).toBe(0.85);
    expect(res.metrics.isTargetMet).toBe(true);
  });
});
