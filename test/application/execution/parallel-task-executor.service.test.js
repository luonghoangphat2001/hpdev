'use strict';

const TaskGraph = require('../../../src/domain/planning/task-graph');
const ParallelTaskExecutorService = require('../../../src/application/services/execution/parallel-task-executor.service');

function plan(tasks) {
  return { graph: new TaskGraph(tasks) };
}

describe('ParallelTaskExecutorService', () => {
  test('starts independent tasks in parallel and respects dependencies', async () => {
    const releases = {};
    const starts = [];
    const handler = {
      execute: jest.fn((task) => {
        starts.push(task.key);
        return new Promise((resolve) => {
          releases[task.key] = () => resolve(`${task.key}-result`);
        });
      }),
    };
    const executor = new ParallelTaskExecutorService({
      handlers: { dan_ops: handler },
      concurrency: 2,
    });
    const pending = executor.execute(plan([
      { id: 'a', key: 'a', assignedAgentId: 'dan_ops', dependsOn: [], timeoutMs: 1000 },
      { id: 'b', key: 'b', assignedAgentId: 'dan_ops', dependsOn: [], timeoutMs: 1000 },
      { id: 'c', key: 'c', assignedAgentId: 'dan_ops', dependsOn: ['a', 'b'], timeoutMs: 1000 },
    ]));

    await Promise.resolve();
    expect(starts).toEqual(['a', 'b']);
    releases.a();
    releases.b();
    await new Promise((resolve) => setImmediate(resolve));
    expect(starts).toEqual(['a', 'b', 'c']);
    releases.c();

    await expect(pending).resolves.toMatchObject({
      status: 'completed',
      summary: { total: 3, succeeded: 3, failed: 0, skipped: 0 },
    });
  });

  test('continues independent branches and skips only failed dependents', async () => {
    const handler = {
      execute: jest.fn(async (task) => {
        if (task.key === 'fail') {
          const error = new Error('private provider error');
          error.code = 'agent_failed';
          throw error;
        }
        return `${task.key}-ok`;
      }),
    };
    const executor = new ParallelTaskExecutorService({
      handlers: { dan_cfo: handler, dan_ops: handler },
    });

    const result = await executor.execute(plan([
      { id: 'a', key: 'fail', assignedAgentId: 'dan_cfo', dependsOn: [], timeoutMs: 1000 },
      { id: 'b', key: 'healthy', assignedAgentId: 'dan_ops', dependsOn: [], timeoutMs: 1000 },
      { id: 'c', key: 'blocked', assignedAgentId: 'dan_cfo', dependsOn: ['a'], timeoutMs: 1000 },
    ]));

    expect(result).toEqual({
      status: 'partial',
      summary: { total: 3, succeeded: 1, failed: 1, skipped: 1 },
      tasks: [
        {
          taskId: 'a',
          key: 'fail',
          agentId: 'dan_cfo',
          status: 'failed',
          error: { code: 'agent_failed' },
        },
        {
          taskId: 'b',
          key: 'healthy',
          agentId: 'dan_ops',
          status: 'completed',
          output: 'healthy-ok',
        },
        {
          taskId: 'c',
          key: 'blocked',
          agentId: 'dan_cfo',
          status: 'skipped',
          error: { code: 'dependency_failed', dependencies: ['a'] },
        },
      ],
    });
  });

  test('fails safely when an assigned handler is missing', async () => {
    const executor = new ParallelTaskExecutorService({ handlers: {} });
    const result = await executor.execute(plan([
      { id: 'a', key: 'a', assignedAgentId: 'dan_missing', dependsOn: [], timeoutMs: 1000 },
    ]));

    expect(result).toMatchObject({
      status: 'failed',
      tasks: [{ status: 'failed', error: { code: 'agent_handler_unavailable' } }],
    });
  });
});
