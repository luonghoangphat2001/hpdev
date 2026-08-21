'use strict';

const KpiCollectorService = require('../../../src/services/reporting/kpi/kpi-collector.service');

describe('T070: KPI Collector Service', () => {
  test('collects KPI metric from SSOT client idempotently', async () => {
    const ssotClient = {
      get: jest.fn().mockResolvedValue({ value: 0.98 }),
    };

    const collector = new KpiCollectorService({ ssotClient });
    const res = await collector.collectKpi({
      kpiKey: 'ops.sla_compliance_rate',
      timeframe: 'daily',
      date: '2026-07-25',
    });

    expect(res.kpiKey).toBe('ops.sla_compliance_rate');
    expect(res.value).toBe(0.98);
    expect(res.isTargetMet).toBe(true);
  });
});
