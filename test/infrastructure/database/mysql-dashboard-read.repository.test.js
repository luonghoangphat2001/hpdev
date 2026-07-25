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
});
