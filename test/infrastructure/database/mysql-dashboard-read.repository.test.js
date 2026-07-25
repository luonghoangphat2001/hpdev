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
          lifecycle_state: 'ACTIVE',
          state_version: 3,
          lifecycle_reason: 'Ready',
          changed_by: 'ceo-dashboard',
          changed_at: '2026-07-25 09:00:00.000',
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
        lifecycleStatus: 'ACTIVE',
        stateVersion: 3,
        lifecycleReason: 'Ready',
        changedBy: 'ceo-dashboard',
        changedAt: '2026-07-25 09:00:00.000',
      },
    ]);
    expect(executor.execute).toHaveBeenCalledWith(
      expect.stringContaining('ars.agent_id IN (?, ?)'),
      ['dan_ops', 'dan_cfo'],
    );
  });

  test('builds parameterized workflow filters and a matching count query', async () => {
    const executor = {
      execute: jest.fn()
        .mockResolvedValueOnce([[{ workflow_id: 'wfl-1' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]),
    };
    const repository = new MysqlDashboardReadRepository(executor);

    await expect(repository.listWorkflows({
      limit: 25,
      offset: 50,
      agentId: 'dan_ops',
      state: 'running',
      search: 'order',
    })).resolves.toEqual({
      rows: [{ workflow_id: 'wfl-1' }],
      total: 1,
    });
    expect(executor.execute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('assigned_agent_id = ?'),
      ['dan_ops', 'running', '%order%', '%order%', '%order%', 25, 50],
    );
    expect(executor.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('COUNT(*) AS total'),
      ['dan_ops', 'running', '%order%', '%order%', '%order%'],
    );
  });
});
