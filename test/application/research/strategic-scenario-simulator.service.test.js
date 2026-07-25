'use strict';

const TaskGraph = require('../../../src/domain/planning/task-graph');
const StrategicScenarioSimulatorService =
  require('../../../src/application/services/research/strategic-scenario-simulator.service');

describe('StrategicScenarioSimulatorService', () => {
  function build() {
    const graph = new TaskGraph([
      {
        id: 'tsk_1',
        key: 'finance',
        assignedAgentId: 'dan_cfo',
        dependsOn: [],
      },
      {
        id: 'tsk_2',
        key: 'operations',
        assignedAgentId: 'dan_ops',
        dependsOn: ['tsk_1'],
      },
    ]);
    const goalTranslator = {
      translate: jest.fn().mockResolvedValue({
        plan: { planId: 'pln_1', graph },
      }),
    };
    const simulationHandlers = {
      dan_cfo: {
        simulate: jest.fn().mockResolvedValue({
          projectedRevenue: 120,
          delta: 20,
        }),
      },
      dan_ops: {
        simulate: jest.fn().mockResolvedValue({
          requiredCapacity: 3,
        }),
      },
    };
    return {
      service: new StrategicScenarioSimulatorService({
        goalTranslator,
        simulationHandlers,
        clock: () => new Date('2026-07-25T08:00:00Z'),
        idFactory: () => 'sim_1',
      }),
      goalTranslator,
      simulationHandlers,
    };
  }

  test('runs a goal what-if through simulation-only handlers with writes disabled', async () => {
    const { service, simulationHandlers } = build();
    const result = await service.simulate({
      goalId: 'gol_1',
      assumptions: { priceIncrease: 0.1 },
      baseline: { revenue: 100 },
      tokenBudget: 2000,
      timeoutMs: 5000,
    });

    expect(result).toMatchObject({
      scenarioId: 'sim_1',
      mode: 'dry_run',
      writesAllowed: false,
      execution: {
        status: 'completed',
        summary: { succeeded: 2 },
      },
    });
    expect(simulationHandlers.dan_cfo.simulate).toHaveBeenCalledWith(
      expect.objectContaining({ writesAllowed: false })
    );
  });

  test('rejects mutation intent before translating or calling an agent', async () => {
    const { service, goalTranslator, simulationHandlers } = build();
    await expect(service.simulate({
      goalId: 'gol_1',
      assumptions: { refund: { execute: true } },
      baseline: {},
      tokenBudget: 100,
      timeoutMs: 1000,
    })).rejects.toMatchObject({ code: 'simulation_mutation_forbidden' });
    expect(goalTranslator.translate).not.toHaveBeenCalled();
    expect(simulationHandlers.dan_cfo.simulate).not.toHaveBeenCalled();
  });

  test('blocks a simulation handler that returns mutation instructions', async () => {
    const { service, simulationHandlers } = build();
    simulationHandlers.dan_cfo.simulate.mockResolvedValue({
      action: { commit: true },
    });
    const result = await service.simulate({
      goalId: 'gol_1',
      assumptions: {},
      baseline: {},
      tokenBudget: 100,
      timeoutMs: 1000,
    });
    expect(result.execution).toMatchObject({
      status: 'failed',
      summary: { failed: 1, skipped: 1 },
    });
  });
});
