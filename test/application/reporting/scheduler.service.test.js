'use strict';

const ReportSchedulerService = require('../../../src/services/reporting/daily/report-scheduler.service');

describe('ReportSchedulerService', () => {
  test('sends once after configured local time and skips duplicate ticks', async () => {
    const aggregator = {
      aggregateAndNotify: jest.fn().mockResolvedValue({ receipt: { duplicate: false } }),
    };
    const scheduler = new ReportSchedulerService({
      aggregator,
      timezone: 'Asia/Ho_Chi_Minh',
      reportTime: '18:00',
      clock: () => new Date('2026-07-25T11:01:00.000Z'),
    });

    await expect(scheduler.tick()).resolves.toMatchObject({
      status: 'sent',
      reportDate: '2026-07-25',
    });
    await expect(scheduler.tick()).resolves.toEqual({
      status: 'skipped',
      reportDate: '2026-07-25',
    });
    expect(aggregator.aggregateAndNotify).toHaveBeenCalledTimes(1);
    expect(aggregator.aggregateAndNotify).toHaveBeenCalledWith({
      reportDate: '2026-07-25',
      from: new Date('2026-07-24T17:00:00.000Z'),
      to: new Date('2026-07-25T17:00:00.000Z'),
    });
  });

  test('does not send before the configured local time', async () => {
    const aggregator = { aggregateAndNotify: jest.fn() };
    const scheduler = new ReportSchedulerService({
      aggregator,
      timezone: 'Asia/Ho_Chi_Minh',
      reportTime: '18:00',
      clock: () => new Date('2026-07-25T10:59:00.000Z'),
    });

    await expect(scheduler.tick()).resolves.toEqual({
      status: 'skipped',
      reportDate: '2026-07-25',
    });
    expect(aggregator.aggregateAndNotify).not.toHaveBeenCalled();
  });
});
