'use strict';

const GoalService = require('@services/workflow/action/goal.service');

describe('GoalService', () => {
  test('creates a child goal only within its parent horizon and dates', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue({
        goal_id: 'gol_year',
        parent_goal_id: null,
        horizon: 'year',
        title: 'Annual growth',
        owner_type: 'ceo',
        owner_id: 'ceo-1',
        target: { metric: 'revenue', value: 100 },
        progress: 0,
        status: 'active',
        starts_at: '2026-01-01T00:00:00Z',
        deadline_at: '2026-12-31T23:59:59Z',
        version: 1,
      }),
      create: jest.fn(async (goal) => goal),
    };
    const service = new GoalService({ repository, idFactory: () => 'gol_q3' });

    await expect(service.create({
      parentGoalId: 'gol_year',
      horizon: 'quarter',
      title: 'Q3 growth',
      ownerType: 'agent',
      ownerId: 'dan_cfo',
      target: { metric: 'revenue', value: 30 },
      startsAt: '2026-07-01T00:00:00Z',
      deadlineAt: '2026-09-30T23:59:59Z',
    })).resolves.toMatchObject({
      goalId: 'gol_q3',
      parentGoalId: 'gol_year',
    });
  });

  test('rejects a child horizon that is not shorter than its parent', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue({
        goal_id: 'gol_q',
        horizon: 'quarter',
        title: 'Q3',
        owner_type: 'ceo',
        owner_id: 'ceo-1',
        target: { metric: 'revenue', value: 30 },
        progress: 0,
        status: 'active',
        starts_at: '2026-07-01T00:00:00Z',
        deadline_at: '2026-09-30T23:59:59Z',
        version: 1,
      }),
      create: jest.fn(),
    };
    const service = new GoalService({ repository });
    await expect(service.create({
      parentGoalId: 'gol_q',
      horizon: 'year',
      title: 'Invalid child',
      ownerType: 'ceo',
      ownerId: 'ceo-1',
      target: { metric: 'x', value: 1 },
      startsAt: '2026-07-01T00:00:00Z',
      deadlineAt: '2026-08-01T00:00:00Z',
    })).rejects.toThrow('horizon');
  });
});
