'use strict';

const crypto = require('crypto');
const TaskGraph = require('../../domain/planning/task-graph');

class PlannerService {
  constructor({
    planningEngine,
    capabilityRegistry,
    clock = () => new Date(),
    idFactory = () => crypto.randomUUID(),
  }) {
    if (!planningEngine || typeof planningEngine.decompose !== 'function') {
      throw new TypeError('PlannerService requires a decomposition engine');
    }
    this.planningEngine = planningEngine;
    this.capabilityRegistry = capabilityRegistry;
    this.clock = clock;
    this.idFactory = idFactory;
  }

  async plan({
    workflowId,
    objective,
    context = {},
    tokenBudget,
    timeoutMs,
  }) {
    this.#validate({ workflowId, objective, tokenBudget, timeoutMs });
    const definitions = await this.planningEngine.decompose({ objective, context });
    if (!Array.isArray(definitions) || definitions.length === 0) {
      throw new TypeError('Decomposition engine returned no tasks');
    }
    const totalWeight = definitions.reduce(
      (sum, task) => sum + this.#weight(task.weight),
      0,
    );
    const createdAt = this.clock();
    const idByKey = new Map(definitions.map((task) => [
      task.key,
      `tsk_${this.idFactory()}`,
    ]));
    if (idByKey.size !== definitions.length || idByKey.has(undefined)) {
      throw new TypeError('Decomposed tasks require unique keys');
    }

    const tasks = definitions.map((definition) => {
      const weight = this.#weight(definition.weight);
      const agent = this.#resolve('agent', definition.capability);
      const model = definition.modelCapability
        ? this.#resolve('model', definition.modelCapability)
        : null;
      return {
        id: idByKey.get(definition.key),
        key: definition.key,
        title: definition.title,
        milestone: definition.milestone || 'execution',
        capability: definition.capability,
        assignedAgentId: agent.id,
        modelProfileId: model?.id || null,
        dependsOn: (definition.dependsOn || []).map((key) => {
          if (!idByKey.has(key)) throw new TypeError(`Unknown task key dependency: ${key}`);
          return idByKey.get(key);
        }),
        tokenBudget: Math.max(1, Math.floor(tokenBudget * weight / totalWeight)),
        timeoutMs: Math.max(100, Math.floor(timeoutMs * weight / totalWeight)),
        deadlineAt: new Date(createdAt.getTime() + timeoutMs).toISOString(),
        input: Object.freeze({ ...(definition.input || {}) }),
      };
    });
    const graph = new TaskGraph(tasks);

    return Object.freeze({
      planId: `pln_${this.idFactory()}`,
      workflowId,
      objective,
      tokenBudget,
      timeoutMs,
      createdAt: createdAt.toISOString(),
      graph,
    });
  }

  #resolve(kind, capability) {
    const candidates = this.capabilityRegistry.query({
      kind,
      capability,
      available: true,
    });
    if (candidates.length === 0) {
      throw new TypeError(`No available ${kind} for capability: ${capability}`);
    }
    return candidates[0];
  }

  #weight(value) {
    const weight = Number(value ?? 1);
    if (!Number.isFinite(weight) || weight <= 0) throw new TypeError('Task weight must be positive');
    return weight;
  }

  #validate({ workflowId, objective, tokenBudget, timeoutMs }) {
    if (!workflowId || !objective) throw new TypeError('workflowId and objective are required');
    if (!Number.isInteger(tokenBudget) || tokenBudget < 1) {
      throw new TypeError('tokenBudget must be a positive integer');
    }
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100) {
      throw new TypeError('timeoutMs must be at least 100');
    }
  }
}

module.exports = PlannerService;
