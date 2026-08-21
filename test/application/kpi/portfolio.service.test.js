'use strict';

const PortfolioManagerService = require('../../../src/services/reporting/kpi/portfolio-manager.service');

describe('PortfolioManagerService', () => {
  test('ranks deterministically and updates changed priorities in one transaction', async () => {
    const repository = {
      findPortfolioCandidates: jest.fn().mockResolvedValue([
        {
          workflow_id: 'wfl_low',
          assigned_agent_id: 'dan_ops',
          priority: 50,
          state_version: 2,
          risk_level: 'low',
          deadline_at: '2026-08-01T00:00:00Z',
          input_context: { portfolio: { urgency: 0.1, impact: 0.2, cost: 0.8 } },
        },
        {
          workflow_id: 'wfl_high',
          assigned_agent_id: 'dan_cfo',
          priority: 50,
          state_version: 3,
          risk_level: 'critical',
          deadline_at: '2026-07-26T00:00:00Z',
          input_context: {
            portfolio: { urgency: 1, impact: 1, goal_alignment: 1, cost: 0.1 },
          },
        },
      ]),
      updatePriority: jest.fn().mockResolvedValue(true),
    };
    const connection = {};
    const service = new PortfolioManagerService({
      transactionManager: { execute: (operation) => operation(connection) },
      workflowRepositoryFactory: (executor) => {
        expect(executor).toBe(connection);
        return repository;
      },
    });

    const ranking = await service.rebalance({
      capacityByAgent: {
        dan_cfo: { active: 0, maxConcurrency: 2 },
        dan_ops: { active: 2, maxConcurrency: 2 },
      },
    });

    expect(ranking[0]).toMatchObject({
      rank: 1,
      workflowId: 'wfl_high',
      agentId: 'dan_cfo',
    });
    expect(repository.updatePriority).toHaveBeenCalledWith(
      'wfl_high',
      3,
      ranking[0].priority,
    );
    expect(repository.updatePriority).toHaveBeenCalledTimes(2);
  });
});
