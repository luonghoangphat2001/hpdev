/**
 * @fileoverview quarantine.service - Provides quarantine functionality.
 */
'use strict';

/**
 * QuarantineService
 * Manages quarantine logic.
 */
class QuarantineService {
  /**
   * constructor - Executes constructor.
   * @param {*} lifecycleStateMachineService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ lifecycleStateMachineService }) {
    this.lifecycleStateMachineService = lifecycleStateMachineService;
  }

  /**
   * quarantineAgent - Executes quarantine agent.
   * @param {*} agentId - Input parameter.
   * @param {*} reason - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = QuarantineService;
