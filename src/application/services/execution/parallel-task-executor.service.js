'use strict';

const TaskResultAggregatorService = require('./task-result-aggregator.service');
const logger = require('../../../services/logger.service');

class ParallelTaskExecutorService {
  constructor({
    handlers,
    concurrency = 5,
    resultAggregator = new TaskResultAggregatorService(),
  }) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new TypeError('concurrency must be a positive integer');
    }
    this.handlers = handlers;
    this.concurrency = concurrency;
    this.resultAggregator = resultAggregator;
  }

  async execute(plan) {
    const graph = plan.graph;
    const results = new Map();
    const succeeded = new Set();
    const terminal = new Set();

    while (terminal.size < graph.list().length) {
      const ready = graph.list().filter((task) =>
        !terminal.has(task.id)
        && task.dependsOn.every((dependency) => succeeded.has(dependency)));
      if (ready.length === 0) {
        graph.list().filter((task) => !terminal.has(task.id)).forEach((task) => {
          terminal.add(task.id);
          results.set(task.id, Object.freeze({
            status: 'skipped',
            error: Object.freeze({
              code: 'dependency_failed',
              dependencies: task.dependsOn.filter((id) => !succeeded.has(id)),
            }),
          }));
        });
        break;
      }

      for (let offset = 0; offset < ready.length; offset += this.concurrency) {
        const batch = ready.slice(offset, offset + this.concurrency);
        const settled = await Promise.all(batch.map((task) => this.#executeOne(task)));
        settled.forEach(({ taskId, result }) => {
          terminal.add(taskId);
          results.set(taskId, result);
          if (result.status === 'completed') succeeded.add(taskId);
        });
      }
    }

    return this.resultAggregator.aggregate(graph, results);
  }

  async #executeOne(task) {
    const handler = this.handlers[task.assignedAgentId];
    const logContext = {
      agent_id: task.assignedAgentId,
      workflow_id: task.workflowId || null,
      task_id: task.id,
      model: task.model || null,
    };
    logger.info('agent_task_started', logContext);
    if (!handler || typeof handler.execute !== 'function') {
      logger.error('agent_task_failed', { ...logContext, error_code: 'agent_handler_unavailable' });
      return {
        taskId: task.id,
        result: Object.freeze({
          status: 'failed',
          error: Object.freeze({ code: 'agent_handler_unavailable' }),
        }),
      };
    }
    try {
      const output = await this.#withTimeout(
        handler.execute(task),
        task.timeoutMs,
      );
      logger.info('agent_task_completed', logContext);
      return {
        taskId: task.id,
        result: Object.freeze({ status: 'completed', output }),
      };
    } catch (error) {
      logger.error('agent_task_failed', {
        ...logContext,
        error_code: error.code || 'task_execution_failed',
        error_message: error.message,
      });
      return {
        taskId: task.id,
        result: Object.freeze({
          status: 'failed',
          error: Object.freeze({
            code: error.code || 'task_execution_failed',
          }),
        }),
      };
    }
  }

  #withTimeout(promise, timeoutMs) {
    let timer;
    const deadline = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error('Task execution timed out');
        error.code = 'task_timeout';
        reject(error);
      }, timeoutMs);
    });
    return Promise.race([Promise.resolve(promise), deadline])
      .finally(() => clearTimeout(timer));
  }
}

module.exports = ParallelTaskExecutorService;
