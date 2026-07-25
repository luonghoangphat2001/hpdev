'use strict';

const GoalWorkflowTranslatorService =
  require('../../src/application/services/goal-workflow-translator.service');
const TaskGraph = require('../../src/domain/planning/task-graph');

describe('GoalWorkflowTranslatorService', () => {
  test('translates an active goal into a milestone task graph with bounded execution', async () => {
    const goalRepository = {
      findById: jest.fn().mockResolvedValue({
        goal_id: 'gol_q3',
        parent_goal_id: 'gol_year',
        horizon: 'quarter',
        title: 'Increase repeat orders',
        owner_type: 'department',
        owner_id: 'customer_support',
        target: JSON.stringify({
          metric: 'repeat_order_rate',
          operator: 'gte',
          value: 0.35,
        }),
        deadline_at: '2026-09-30T23:59:59Z',
        status: 'active',
        version: 2,
      }),
    };
    const graph = new TaskGraph([
      {
        id: 'tsk_1',
        milestone: 'measure',
        dependsOn: [],
        tokenBudget: 1000,
        timeoutMs: 2000,
      },
      {
        id: 'tsk_2',
        milestone: 'improve',
        dependsOn: ['tsk_1'],
        tokenBudget: 2000,
        timeoutMs: 4000,
      },
    ]);
    const planner = {
      plan: jest.fn().mockResolvedValue({ planId: 'pln_1', graph }),
    };
    const translator = new GoalWorkflowTranslatorService({ goalRepository, planner });

    const result = await translator.translate('gol_q3', {
      tokenBudget: 3000,
      timeoutMs: 6000,
    });

    expect(planner.plan).toHaveBeenCalledWith(expect.objectContaining({
      workflowId: 'goal:gol_q3:v2',
      objective: expect.stringContaining('repeat_order_rate'),
      context: expect.objectContaining({
        horizon: 'quarter',
        owner: { type: 'department', id: 'customer_support' },
      }),
      tokenBudget: 3000,
      timeoutMs: 6000,
    }));
    expect(result.milestones).toEqual([
      { name: 'measure', taskIds: ['tsk_1'] },
      { name: 'improve', taskIds: ['tsk_2'] },
    ]);
  });

  test('does not translate achieved or cancelled goals', async () => {
    const translator = new GoalWorkflowTranslatorService({
      goalRepository: {
        findById: jest.fn().mockResolvedValue({
          goal_id: 'gol_done',
          status: 'achieved',
        }),
      },
      planner: { plan: jest.fn() },
    });
    await expect(translator.translate('gol_done', {
      tokenBudget: 100,
      timeoutMs: 1000,
    })).rejects.toThrow('Terminal goal');
  });
});
