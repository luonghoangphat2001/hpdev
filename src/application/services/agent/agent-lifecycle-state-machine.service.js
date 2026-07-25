'use strict';

const VALID_STATES = [
  'DRAFT', 'TESTING', 'ACTIVE', 'PAUSED',
  'SUSPENDED', 'QUARANTINED', 'FIXING', 'CANARY', 'RETIRED'
];

class AgentLifecycleStateMachineService {
  constructor() {
    this.states = new Map();
  }

  getAgentState(agentId) {
    return this.states.get(agentId) || 'ACTIVE';
  }

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

module.exports = AgentLifecycleStateMachineService;
