'use strict';

class DependencyBlockingFallbackRoutingService {
  constructor({ lifecycleStateMachineService }) {
    this.lifecycleStateMachineService = lifecycleStateMachineService;
  }

  routeWorkflowWithFallback({ agentId, workflowTask }) {
    const currentState = this.lifecycleStateMachineService ? this.lifecycleStateMachineService.getAgentState(agentId) : 'ACTIVE';

    if (currentState === 'QUARANTINED' || currentState === 'PAUSED' || currentState === 'SUSPENDED') {
      return Object.freeze({
        workflowTask,
        primaryAgent: agentId,
        blocked: true,
        fallbackRouted: true,
        assignedFallbackAgent: 'dan_cfo',
        reason: `Primary agent ${agentId} is in ${currentState} state`,
        routedAt: new Date().toISOString(),
      });
    }

    return Object.freeze({
      workflowTask,
      primaryAgent: agentId,
      blocked: false,
      fallbackRouted: false,
      assignedFallbackAgent: null,
      routedAt: new Date().toISOString(),
    });
  }
}

module.exports = DependencyBlockingFallbackRoutingService;
