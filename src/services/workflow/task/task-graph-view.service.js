/**
 * @fileoverview task-graph-view.service - Provides task-graph-view functionality.
 */
'use strict';

/**
 * TaskGraphViewService
 * Manages task graph view logic.
 */
class TaskGraphViewService {
  /**
   * renderGraphData - Executes render graph data.
   * @param {*} tasks - Input parameter.
   * @param {*} dependencies - Input parameter.
   * @returns {*} Result of operation.
   */
  renderGraphData({ tasks = [], dependencies = [] }) {
    const nodes = tasks.map(t => Object.freeze({ id: t.id, name: t.name, status: t.status }));
    const edges = dependencies.map(d => Object.freeze({ from: d.from, to: d.to }));

    return Object.freeze({
      nodes: Object.freeze(nodes),
      edges: Object.freeze(edges),
      renderedAt: new Date().toISOString(),
    });
  }
}

module.exports = TaskGraphViewService;
