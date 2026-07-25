'use strict';

const DashboardReadModelService =
  require('../../../src/application/services/monitoring/dashboard-read-model.service');

describe('T122 supplemental: Dashboard Read Model Service', () => {
  test('returns database-backed operational counts and live metrics', async () => {
    const dashboardRepository = {
      getOverview: jest.fn().mockResolvedValue({
        activeWorkflowCount: 2,
        pendingApprovalCount: 1,
        unresolvedDeadLetterCount: 0,
        openExceptionCount: 3,
      }),
    };
    const metricsRegistry = {
      snapshot: jest.fn().mockReturnValue({ counters: { requests: 9 } }),
    };
    const service = new DashboardReadModelService({
      dashboardRepository,
      metricsRegistry,
      productionEnabled: false,
    });

    const result = await service.getOverview();

    expect(result.operationalCounts.activeWorkflowCount).toBe(2);
    expect(result.metrics.counters.requests).toBe(9);
    expect(result.productionEnabled).toBe(false);
    expect(dashboardRepository.getOverview).toHaveBeenCalledTimes(1);
  });
});
