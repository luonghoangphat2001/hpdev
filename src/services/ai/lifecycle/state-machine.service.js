/**
 * @fileoverview state-machine.service - Provides state-machine functionality.
 */
'use strict';

const VALID_STATES = [
  'DRAFT', 'TESTING', 'ACTIVE', 'PAUSED',
  'SUSPENDED', 'QUARANTINED', 'FIXING', 'CANARY', 'RETIRED'
];

/**
 * StateMachineService
 * Manages state machine logic.
 */
class StateMachineService {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    this.states = new Map();
  }

  /**
   * getAgentState - Executes get agent state.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  getAgentState(agentId) {
    return this.states.get(agentId) || 'ACTIVE';
  }

  /**
   * transitionState - Executes transition state.
   * @param {*} agentId - Input parameter.
   * @param {*} toState - Input parameter.
   * @param {*} reason - Input parameter.
   * @returns {*} Result of operation.
   */
  transitionState({ agentId, toState, reason }) {
    if (!VALID_STATES.includes(toState)) {
      throw new Error(`Invalid lifecycle state: ${toState}`);
    }

    const fromState = this.getAgentState(agentId);
    this.states.set(agentId, toState);

    return Object.freeze({
      agentId,
      fromState,
      toState,
      reason,
      transitionedAt: new Date().toISOString(),
    });
  }
}

module.exports = StateMachineService;
