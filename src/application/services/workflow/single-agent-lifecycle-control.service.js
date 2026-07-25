'use strict';

class SingleAgentLifecycleControlService {
  constructor({ lifecycleStateMachineService }) {
    this.lifecycleStateMachineService = lifecycleStateMachineService;
  }

  pauseAgent({ agentId, reason }) {
    if (this.lifecycleStateMachineService) {
      return this.lifecycleStateMachineService.transitionState({ agentId, toState: 'PAUSED', reason });
    }
    return Object.freeze({ agentId, state: 'PAUSED', reason, controlledAt: new Date().toISOString() });
  }

  resumeAgent({ agentId, reason }) {
    if (this.lifecycleStateMachineService) {
      return this.lifecycleStateMachineService.transitionState({ agentId, toState: 'ACTIVE', reason });
    }
    return Object.freeze({ agentId, state: 'ACTIVE', reason, controlledAt: new Date().toISOString() });
  }
}

module.exports = SingleAgentLifecycleControlService;
