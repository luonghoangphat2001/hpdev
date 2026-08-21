/**
 * @fileoverview agent-control.service - Provides agent-control functionality.
 */
'use strict';

/**
 * AgentControlService
 * Manages agent control logic.
 */
class AgentControlService {
  /**
   * constructor - Executes constructor.
   * @param {*} lifecycleStateMachineService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ lifecycleStateMachineService }) {
    this.lifecycleStateMachineService = lifecycleStateMachineService;
  }

  /**
   * pauseAgent - Executes pause agent.
   * @param {*} agentId - Input parameter.
   * @param {*} reason - Input parameter.
   * @returns {*} Result of operation.
   */
  pauseAgent({ agentId, reason }) {
    if (this.lifecycleStateMachineService) {
      return this.lifecycleStateMachineService.transitionState({ agentId, toState: 'PAUSED', reason });
    }
    return Object.freeze({ agentId, state: 'PAUSED', reason, controlledAt: new Date().toISOString() });
  }

  /**
   * resumeAgent - Executes resume agent.
   * @param {*} agentId - Input parameter.
   * @param {*} reason - Input parameter.
   * @returns {*} Result of operation.
   */
  resumeAgent({ agentId, reason }) {
    if (this.lifecycleStateMachineService) {
      return this.lifecycleStateMachineService.transitionState({ agentId, toState: 'ACTIVE', reason });
    }
    return Object.freeze({ agentId, state: 'ACTIVE', reason, controlledAt: new Date().toISOString() });
  }
}

module.exports = AgentControlService;
