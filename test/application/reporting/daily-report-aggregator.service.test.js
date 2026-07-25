'use strict';

const DailyReportAggregatorService = require('../../../src/application/services/reporting/daily-report-aggregator.service');

function reporter(agentId, implementation) {
  return {
    agent: { id: agentId, department: agentId.replace('dan_', '') },
    report: jest.fn(implementation),
  };
}

describe('DailyReportAggregatorService', () => {
  const period = {
    reportDate: '2026-07-25',
    from: new Date('2026-07-24T17:00:00Z'),
    to: new Date('2026-07-25T17:00:00Z'),
  };

  test('runs all five reporters in parallel and sends one combined message', async () => {
    const releases = [];
    const reporters = [
      'dan_rnd', 'dan_logistics', 'dan_cfo', 'dan_ops', 'dan_cskh',
    ].map((agentId) => reporter(agentId, () => new Promise((resolve) => {
      releases.push(() => resolve({
        agentId,
        department: agentId,
        status: 'ok',
        metrics: {
          workflowCount: 1,
          completedCount: 1,
          failedCount: 0,
          awaitingApprovalCount: 0,
          actionCount: 1,
        },
      }));
    })));
    const notificationGateway = {
      notify: jest.fn().mockResolvedValue({ notificationId: 7 }),
    };
    const aggregator = new DailyReportAggregatorService({
      reporters,
      notificationGateway,
      timeoutMs: 1000,
    });

    const pending = aggregator.aggregateAndNotify(period);
    await Promise.resolve();
    expect(reporters.every(({ report }) => report.mock.calls.length === 1)).toBe(true);
    releases.forEach((release) => release());
    const result = await pending;

    expect(result.reports).toHaveLength(5);
    expect(notificationGateway.notify).toHaveBeenCalledTimes(1);
    expect(notificationGateway.notify).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: 'daily-agent-report:2026-07-25',
      severity: 'success',
      message: expect.stringContaining('dan_cskh'),
    }));
  });

  test('uses a degraded fallback without blocking healthy agent reports', async () => {
    const healthyMetrics = {
      workflowCount: 0,
      completedCount: 0,
      failedCount: 0,
      awaitingApprovalCount: 0,
      actionCount: 0,
    };
    const reporters = [
      reporter('dan_rnd', async () => {
        const error = new Error('upstream unavailable');
        error.code = 'ssot_unavailable';
        throw error;
      }),
      ...['dan_logistics', 'dan_cfo', 'dan_ops', 'dan_cskh'].map(
        (agentId) => reporter(agentId, async () => ({
          agentId,
          department: agentId,
          status: 'ok',
          metrics: healthyMetrics,
        }))
      ),
    ];
    const notificationGateway = { notify: jest.fn().mockResolvedValue({}) };
    const aggregator = new DailyReportAggregatorService({
      reporters,
      notificationGateway,
    });

    const result = await aggregator.aggregateAndNotify(period);

    expect(result.reports[0]).toMatchObject({
      agentId: 'dan_rnd',
      status: 'degraded',
      errorCode: 'ssot_unavailable',
    });
    expect(notificationGateway.notify).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'warning',
      message: expect.stringContaining('chưa lấy được báo cáo'),
    }));
  });
});
