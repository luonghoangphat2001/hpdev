/**
 * @fileoverview fallback-routing.service - Provides fallback-routing functionality.
 */
'use strict';

/**
 * FallbackRoutingService
 * Manages fallback routing logic.
 */
class FallbackRoutingService {
  /**
   * constructor - Executes constructor.
   * @param {*} lifecycleStateMachineService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ lifecycleStateMachineService }) {
    this.lifecycleStateMachineService = lifecycleStateMachineService;
  }

  /**
   * routeWorkflowWithFallback - Executes route workflow with fallback.
   * @param {*} agentId - Input parameter.
   * @param {*} workflowTask - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = FallbackRoutingService;
