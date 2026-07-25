'use strict';

const TaskGraph = require('../../src/domain/planning/task-graph');

describe('TaskGraph', () => {
  test('returns dependency-safe execution order and parallel-ready tasks', () => {
    const graph = new TaskGraph([
      { id: 'a', dependsOn: [] },
      { id: 'b', dependsOn: ['a'] },
      { id: 'c', dependsOn: ['a'] },
      { id: 'd', dependsOn: ['b', 'c'] },
    ]);

    expect(graph.list().map(({ id }) => id)).toEqual(['a', 'b', 'c', 'd']);
    expect(graph.ready([]).map(({ id }) => id)).toEqual(['a']);
    expect(graph.ready(['a']).map(({ id }) => id)).toEqual(['b', 'c']);
    expect(graph.ready(['a', 'b', 'c']).map(({ id }) => id)).toEqual(['d']);
  });

  test('rejects missing dependencies, self-dependencies, and cycles', () => {
    expect(() => new TaskGraph([{ id: 'a', dependsOn: ['missing'] }]))
      .toThrow('Unknown task dependency');
    expect(() => new TaskGraph([{ id: 'a', dependsOn: ['a'] }]))
      .toThrow('cannot depend on itself');
    expect(() => new TaskGraph([
      { id: 'a', dependsOn: ['b'] },
      { id: 'b', dependsOn: ['a'] },
    ])).toThrow('contains a cycle');
  });
});
