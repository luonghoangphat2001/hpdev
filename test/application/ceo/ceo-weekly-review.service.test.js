'use strict';

const CeoWeeklyReviewService = require('../../../src/application/services/ceo/ceo-weekly-review.service');

describe('T055: CEO Weekly Business Review Service', () => {
  test('generates weekly review successfully', async () => {
    const repository = {
      weeklyTrendSnapshot: jest.fn().mockResolvedValue({ growth: '12%' }),
      goalOffTrackSnapshot: jest.fn().mockResolvedValue({ count: 0, goals: [] }),
      recommendedActionSnapshot: jest.fn().mockResolvedValue([{ action: 'optimize_inventory' }]),
    };
    const financeProvider = {
      getFinanceSummary: jest.fn().mockResolvedValue({ revenue: 50000000 }),
    };
    const notificationGateway = {
      notify: jest.fn().mockResolvedValue({ id: 'msg_123' }),
    };

    const service = new CeoWeeklyReviewService({
      repository,
      financeProvider,
      notificationGateway,
    });

    const res = await service.generate({ weekNumber: 30, year: 2026, from: '2026-07-19', to: '2026-07-25' });

    expect(res.weekNumber).toBe(30);
    expect(res.receipt.id).toBe('msg_123');
    expect(notificationGateway.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'ceo-weekly-review:2026-W30',
        severity: 'success',
      })
    );
  });

  test('handles degraded section on timeout/failure', async () => {
    const repository = {
      weeklyTrendSnapshot: jest.fn().mockRejectedValue(new Error('DB error')),
      goalOffTrackSnapshot: jest.fn().mockResolvedValue({ count: 1 }),
      recommendedActionSnapshot: jest.fn().mockResolvedValue([]),
    };
    const financeProvider = {
      getFinanceSummary: jest.fn().mockResolvedValue({ revenue: 0 }),
    };
    const notificationGateway = {
      notify: jest.fn().mockResolvedValue({ id: 'msg_456' }),
    };

    const service = new CeoWeeklyReviewService({
      repository,
      financeProvider,
      notificationGateway,
    });

    const res = await service.generate({ weekNumber: 30, year: 2026, from: '2026-07-19', to: '2026-07-25' });

    expect(res.sections.weeklyTrends.degraded).toBe(true);
    expect(notificationGateway.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warning',
      })
    );
  });
});
