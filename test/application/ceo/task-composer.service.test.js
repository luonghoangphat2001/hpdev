'use strict';

const TaskComposerService = require('../../../src/services/ceo/command/task-composer.service');

describe('T126: CEO Task Composer and Multi-Agent Assignment Service', () => {
  test('composes task and assigns to multiple agents with budget cap', () => {
    const service = new TaskComposerService();
    const task = service.composeTask({
      title: 'Analyze Q3 Beverage Promotion',
      assignedAgents: ['dan_ops', 'dan_cfo'],
      priority: 'CRITICAL',
      budgetCapUSD: 5.0,
    });

    expect(task.assignedAgents).toContain('dan_ops');
    expect(task.assignedAgents).toContain('dan_cfo');
    expect(task.budgetCapUSD).toBe(5.0);
  });
});
