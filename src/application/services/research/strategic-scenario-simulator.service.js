'use strict';

const crypto = require('crypto');
const SimulationSafetyPolicy = require('../../../domain/policies/simulation-safety.policy');
const TaskResultAggregatorService = require('../execution/task-result-aggregator.service');

class StrategicScenarioSimulatorService {
  constructor({
    goalTranslator,
    simulationHandlers,
    safetyPolicy = new SimulationSafetyPolicy(),
    resultAggregator = new TaskResultAggregatorService(),
    clock = () => new Date(),
    idFactory = () => `sim_${crypto.randomUUID()}`,
  }) {
    this.goalTranslator = goalTranslator;
    this.simulationHandlers = simulationHandlers;
    this.safetyPolicy = safetyPolicy;
    this.resultAggregator = resultAggregator;
    this.clock = clock;
    this.idFactory = idFactory;
  }

  async simulate({
    goalId,
    assumptions,
    baseline,
    tokenBudget,
    timeoutMs,
  }) {
    this.safetyPolicy.assertSafe(assumptions);
    this.safetyPolicy.assertSafe(baseline);
    const translated = await this.goalTranslator.translate(goalId, {
      tokenBudget,
      timeoutMs,
    });
    const graph = translated.plan.graph;
    const results = new Map();
    for (const task of graph.list()) {
      const failedDependency = task.dependsOn.find(
        (dependency) => results.get(dependency)?.status !== 'completed'
      );
      if (failedDependency) {
        results.set(task.id, {
          status: 'skipped',
          error: { code: 'simulation_dependency_failed' },
        });
        continue;
      }
      const handler = this.simulationHandlers[task.assignedAgentId];
      if (!handler || typeof handler.simulate !== 'function') {
        results.set(task.id, {
          status: 'failed',
          error: { code: 'simulation_handler_unavailable' },
        });
        continue;
      }
      try {
        const output = await handler.simulate(Object.freeze({
          task,
          assumptions: Object.freeze({ ...assumptions }),
          baseline: Object.freeze({ ...baseline }),
          writesAllowed: false,
        }));
        this.safetyPolicy.assertSafe(output);
        results.set(task.id, { status: 'completed', output });
      } catch (error) {
        results.set(task.id, {
          status: 'failed',
          error: { code: error.code || 'simulation_failed' },
        });
      }
    }
    const execution = this.resultAggregator.aggregate(graph, results);
    return Object.freeze({
      scenarioId: this.idFactory(),
      goalId,
      mode: 'dry_run',
      writesAllowed: false,
      assumptions: Object.freeze({ ...assumptions }),
      baseline: Object.freeze({ ...baseline }),
      execution,
      simulatedAt: this.clock().toISOString(),
    });
  }
}

module.exports = StrategicScenarioSimulatorService;
