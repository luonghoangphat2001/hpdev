'use strict';

const TaskPlannerService = require('../../../src/services/workflow/task/task-planner.service');
const { buildCapabilityRegistry } = require('../../../src/services/ai/capabilities/capability-builder');

describe('TaskPlannerService', () => {
  function build(definitions) {
    const ids = ['one', 'two', 'three', 'plan'];
    return new TaskPlannerService({
      planningEngine: {
        decompose: jest.fn().mockResolvedValue(definitions),
      },
      capabilityRegistry: buildCapabilityRegistry(),
      clock: () => new Date('2026-07-25T08:00:00.000Z'),
      idFactory: () => ids.shift(),
    });
  }

  test('decomposes work into a capability-routed graph with explicit budgets', async () => {
    const planner = build([
      {
        key: 'analyze',
        title: 'Analyze inventory',
        capability: 'inventory_analysis',
        modelCapability: 'planning',
        weight: 2,
      },
      {
        key: 'draft',
        title: 'Draft purchase order',
        capability: 'purchase_order_draft',
        dependsOn: ['analyze'],
        weight: 1,
      },
    ]);

    const plan = await planner.plan({
      workflowId: 'wfl_1',
      objective: 'Replenish low stock safely',
      tokenBudget: 3000,
      timeoutMs: 9000,
    });

    expect(plan).toMatchObject({
      planId: 'pln_three',
      workflowId: 'wfl_1',
      tokenBudget: 3000,
      timeoutMs: 9000,
    });
    expect(plan.graph.list()).toEqual([
      expect.objectContaining({
        id: 'tsk_one',
        assignedAgentId: 'dan_logistics',
        modelProfileId: 'reasoning',
        tokenBudget: 2000,
        timeoutMs: 6000,
      }),
      expect.objectContaining({
        id: 'tsk_two',
        assignedAgentId: 'dan_logistics',
        dependsOn: ['tsk_one'],
        tokenBudget: 1000,
        timeoutMs: 3000,
      }),
    ]);
  });

  test('fails closed when no registered agent can satisfy a task', async () => {
    const planner = build([{
      key: 'unsafe',
      title: 'Unknown operation',
      capability: 'raw_database_write',
    }]);

    await expect(planner.plan({
      workflowId: 'wfl_2',
      objective: 'Unsafe',
      tokenBudget: 100,
      timeoutMs: 1000,
    })).rejects.toThrow('No available agent for capability: raw_database_write');
  });

  test('rejects invalid task keys and budgets', async () => {
    const planner = build([
      { key: 'a', capability: 'menu_analysis' },
      { key: 'a', capability: 'menu_analysis' },
    ]);

    await expect(planner.plan({
      workflowId: 'wfl_3',
      objective: 'Duplicate',
      tokenBudget: 100,
      timeoutMs: 1000,
    })).rejects.toThrow('unique keys');
    await expect(planner.plan({
      workflowId: 'wfl_3',
      objective: 'No budget',
      tokenBudget: 0,
      timeoutMs: 1000,
    })).rejects.toThrow('tokenBudget');
  });
});
