'use strict';

class WorkflowFilterSearchService {
  filterWorkflows({ workflows = [], agent, status, minRiskLevel }) {
    let filtered = workflows;
    if (agent) {
      filtered = filtered.filter(w => w.agent === agent);
    }
    if (status) {
      filtered = filtered.filter(w => w.status === status);
    }
    if (minRiskLevel) {
      filtered = filtered.filter(w => w.riskLevel === minRiskLevel);
    }

    return Object.freeze({
      total: filtered.length,
      workflows: Object.freeze(filtered),
      filteredAt: new Date().toISOString(),
    });
  }
}

module.exports = WorkflowFilterSearchService;
