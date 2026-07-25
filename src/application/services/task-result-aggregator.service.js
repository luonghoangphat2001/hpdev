'use strict';

class TaskResultAggregatorService {
  aggregate(graph, resultMap) {
    const tasks = graph.list().map((task) => {
      const result = resultMap.get(task.id) || {
        status: 'skipped',
        error: { code: 'task_not_executed' },
      };
      return Object.freeze({
        taskId: task.id,
        key: task.key,
        agentId: task.assignedAgentId,
        ...result,
      });
    });
    const succeeded = tasks.filter(({ status }) => status === 'completed').length;
    const failed = tasks.filter(({ status }) => status === 'failed').length;
    const skipped = tasks.filter(({ status }) => status === 'skipped').length;
    const status = succeeded === tasks.length
      ? 'completed'
      : succeeded > 0
        ? 'partial'
        : 'failed';

    return Object.freeze({
      status,
      summary: Object.freeze({
        total: tasks.length,
        succeeded,
        failed,
        skipped,
      }),
      tasks: Object.freeze(tasks),
    });
  }
}

module.exports = TaskResultAggregatorService;
