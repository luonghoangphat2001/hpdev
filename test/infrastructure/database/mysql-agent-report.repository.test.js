'use strict';

const MysqlAgentRepository = require('../../../src/repositories/AgentRepository');

describe('MysqlAgentRepository', () => {
  test('returns normalized numeric metrics scoped to one agent and period', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([[
        {
          workflow_count: '4',
          completed_count: '3',
          failed_count: '1',
          awaiting_approval_count: '0',
          action_count: '7',
        },
      ]]),
    };
    const repository = new MysqlAgentRepository(executor);
    const from = new Date('2026-07-24T17:00:00Z');
    const to = new Date('2026-07-25T17:00:00Z');

    await expect(repository.summarizeAgent('dan_cfo', from, to)).resolves.toEqual({
      workflowCount: 4,
      completedCount: 3,
      failedCount: 1,
      awaitingApprovalCount: 0,
      actionCount: 7,
    });
    expect(executor.execute.mock.calls[0][1]).toEqual([
      'dan_cfo', from, to, 'dan_cfo', from, to,
    ]);
  });
});
