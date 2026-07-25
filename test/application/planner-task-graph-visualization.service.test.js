'use strict';

const PlannerTaskGraphVisualizationService = require('../../src/application/services/planner-task-graph-visualization.service');

describe('T129: Planner/Task Graph Visualization Service', () => {
  test('renders nodes and edges for task graph visualization', () => {
    const service = new PlannerTaskGraphVisualizationService();
    const result = service.renderGraphData({
      tasks: [{ id: 't1', name: 'Task 1', status: 'COMPLETED' }, { id: 't2', name: 'Task 2', status: 'PENDING' }],
      dependencies: [{ from: 't1', to: 't2' }],
    });

    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].from).toBe('t1');
  });
});
