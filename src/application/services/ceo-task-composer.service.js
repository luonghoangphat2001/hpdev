'use strict';

class CeoTaskComposerService {
  composeTask({ title, assignedAgents = [], priority = 'HIGH', deadline, budgetCapUSD = 1.0 }) {
    if (!assignedAgents || assignedAgents.length === 0) {
      throw new Error('Task must be assigned to at least one agent');
    }

    return Object.freeze({
      taskId: `ceo_task_${Math.random().toString(36).substr(2, 9)}`,
      title,
      assignedAgents: Object.freeze([...assignedAgents]),
      priority,
      deadline: deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      budgetCapUSD,
      status: 'ASSIGNED',
      composedAt: new Date().toISOString(),
    });
  }
}

module.exports = CeoTaskComposerService;
