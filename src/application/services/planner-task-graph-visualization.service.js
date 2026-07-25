'use strict';

class PlannerTaskGraphVisualizationService {
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

module.exports = PlannerTaskGraphVisualizationService;
