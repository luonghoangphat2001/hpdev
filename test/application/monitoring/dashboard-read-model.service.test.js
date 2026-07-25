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

  test('merges five registered agent profiles with database activity', async () => {
    const dashboardRepository = {
      getOverview: jest.fn(),
      getAgentSummaries: jest.fn().mockResolvedValue([
        {
          agentId: 'dan_ops',
          workflowCount: 7,
          activeWorkflowCount: 2,
          failedWorkflowCount: 1,
          lastActivityAt: '2026-07-25T10:00:00.000Z',
        },
      ]),
    };
    const agentRegistry = {
      list: () => [
        { id: 'dan_ops', department: 'operations', mission: 'ops', version: '1', capabilities: [], permissions: [] },
        { id: 'dan_cfo', department: 'finance', mission: 'finance', version: '1', capabilities: [], permissions: [] },
      ],
    };
    const service = new DashboardReadModelService({
      dashboardRepository,
      agentRegistry,
    });

    const agents = await service.getAgents();

    expect(agents).toHaveLength(2);
    expect(agents[0]).toMatchObject({
      agentId: 'dan_ops',
      activityStatus: 'BUSY',
      activeWorkflowCount: 2,
      lifecycleStatus: 'NOT_PERSISTED',
    });
    expect(agents[1]).toMatchObject({
      agentId: 'dan_cfo',
      activityStatus: 'IDLE',
      workflowCount: 0,
    });
  });
});
