'use strict';

const DailyBriefService = require('../../../src/services/ceo/daily/daily-brief.service');

describe('DailyBriefService', () => {
  const period = {
    reportDate: '2026-07-25',
    from: new Date('2026-07-24T17:00:00Z'),
    to: new Date('2026-07-25T17:00:00Z'),
  };

  function build(overrides = {}) {
    const repository = {
      goalSnapshot: jest.fn().mockResolvedValue({ active: 4, at_risk: 1 }),
      kpiSnapshot: jest.fn().mockResolvedValue({
        deviations: 1, tokens: 5000, costUsd: 0.5,
      }),
      exceptionSnapshot: jest.fn().mockResolvedValue({ high: 2, critical: 0 }),
      approvalSnapshot: jest.fn().mockResolvedValue({ pending: 3 }),
      completedSnapshot: jest.fn().mockResolvedValue([
        { agentId: 'dan_ops', count: 7 },
      ]),
      ...overrides,
    };
    const financeProvider = {
      getFinanceSummary: jest.fn().mockResolvedValue({
        data: { revenue: 1000000, refunds: 50000 },
      }),
    };
    const notificationGateway = { notify: jest.fn().mockResolvedValue({ id: 1 }) };
    return {
      service: new DailyBriefService({
        repository,
        financeProvider,
        notificationGateway,
        sectionTimeoutMs: 100,
      }),
      repository,
      financeProvider,
      notificationGateway,
    };
  }

  test('collects six CEO sections in parallel and sends exactly one daily message', async () => {
    const { service, repository, financeProvider, notificationGateway } = build();
    const result = await service.generate(period);

    expect(Object.keys(result.sections)).toEqual([
      'goals', 'kpis', 'finance', 'risks', 'decisions', 'completed',
    ]);
    expect(repository.goalSnapshot).toHaveBeenCalled();
    expect(financeProvider.getFinanceSummary).toHaveBeenCalledWith('day');
    expect(notificationGateway.notify).toHaveBeenCalledTimes(1);
    expect(notificationGateway.notify).toHaveBeenCalledWith({
      idempotencyKey: 'ceo-daily-brief:2026-07-25',
      title: 'CEO Daily Brief — 2026-07-25',
      message: expect.stringContaining('Chờ quyết định'),
      severity: 'success',
    });
  });

  test('keeps the brief available when one section degrades', async () => {
    const failure = Object.assign(new Error('KPI unavailable'), {
      code: 'kpi_unavailable',
    });
    const { service, notificationGateway } = build({
      kpiSnapshot: jest.fn().mockRejectedValue(failure),
    });

    const result = await service.generate(period);
    expect(result.sections.kpis).toEqual({
      degraded: true,
      errorCode: 'kpi_unavailable',
    });
    expect(notificationGateway.notify).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning' })
    );
  });
});
