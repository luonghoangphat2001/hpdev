'use strict';

class AgentQuarantineInvestigationService {
  constructor({ lifecycleStateMachineService }) {
    this.lifecycleStateMachineService = lifecycleStateMachineService;
  }

  quarantineAgent({ agentId, reason }) {
    if (this.lifecycleStateMachineService) {
      this.lifecycleStateMachineService.transitionState({ agentId, toState: 'QUARANTINED', reason });
    }

    return Object.freeze({
      agentId,
      status: 'QUARANTINED',
      credentialsRevoked: true,
      evidencePreserved: true,
      investigationId: `inv_${Math.random().toString(36).substr(2, 9)}`,
      quarantinedAt: new Date().toISOString(),
    });
  }
}

module.exports = AgentQuarantineInvestigationService;
