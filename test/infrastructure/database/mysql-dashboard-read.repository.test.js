'use strict';

const MysqlDashboardReadRepository =
  require('../../../src/infrastructure/database/repositories/mysql-dashboard-read.repository');

describe('T122 supplemental: MySQL Dashboard Read Repository', () => {
  test('maps aggregate database values to the dashboard contract', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([[
        {
          active_workflow_count: 4,
          pending_approval_count: 2,
          unresolved_dead_letter_count: 1,
          open_exception_count: 3,
        },
      ]]),
    };
    const repository = new MysqlDashboardReadRepository(executor);

    await expect(repository.getOverview()).resolves.toEqual({
      activeWorkflowCount: 4,
      pendingApprovalCount: 2,
      unresolvedDeadLetterCount: 1,
      openExceptionCount: 3,
    });
    expect(executor.execute).toHaveBeenCalledWith(
      expect.stringContaining('FROM workflows'),
    );
  });

  test('returns per-agent workflow activity without inventing runtime state', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([[
        {
          agent_id: 'dan_ops',
          workflow_count: 8,
          active_workflow_count: 2,
          failed_workflow_count: 1,
          last_activity_at: '2026-07-25 10:00:00.000',
        },
      ]]),
    };
    const repository = new MysqlDashboardReadRepository(executor);

    await expect(repository.getAgentSummaries(['dan_ops', 'dan_cfo'])).resolves.toEqual([
      {
        agentId: 'dan_ops',
        workflowCount: 8,
        activeWorkflowCount: 2,
        failedWorkflowCount: 1,
        lastActivityAt: '2026-07-25 10:00:00.000',
      },
    ]);
    expect(executor.execute).toHaveBeenCalledWith(
      expect.stringContaining('assigned_agent_id IN (?, ?)'),
      ['dan_ops', 'dan_cfo'],
    );
  });
});
