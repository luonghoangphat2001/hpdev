'use strict';

const Goal = require('@services/workflow/action/goal');

function input(patch = {}) {
  return {
    goalId: 'gol_1',
    horizon: 'quarter',
    title: 'Increase repeat orders',
    ownerType: 'department',
    ownerId: 'customer_support',
    target: { metric: 'repeat_order_rate', operator: 'gte', value: 0.35 },
    startsAt: '2026-07-01T00:00:00Z',
    deadlineAt: '2026-09-30T23:59:59Z',
    ...patch,
  };
}

describe('Goal', () => {
  test('models a versioned OKR target, owner, horizon and deadline', () => {
    const goal = new Goal(input());
    expect(goal).toMatchObject({
      horizon: 'quarter',
      ownerType: 'department',
      ownerId: 'customer_support',
      status: 'draft',
      progress: 0,
      version: 1,
    });
  });

  test('enforces status transitions and achieved progress', () => {
    const active = new Goal(input()).transition('active', 0.1);
    const achieved = active.transition('achieved', 1);
    expect(achieved).toMatchObject({ status: 'achieved', progress: 1, version: 3 });
    expect(() => active.transition('achieved', 0.9)).toThrow('progress 1');
    expect(() => achieved.transition('active', 1)).toThrow('not allowed');
  });

  test('rejects invalid target and date range', () => {
    expect(() => new Goal(input({ target: {} }))).toThrow('target');
    expect(() => new Goal(input({
      deadlineAt: '2026-06-01T00:00:00Z',
    }))).toThrow('deadline');
  });
});
