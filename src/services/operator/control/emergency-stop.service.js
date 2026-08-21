/**
 * @fileoverview emergency-stop.service - Provides emergency-stop functionality.
 */
'use strict';

/**
 * EmergencyStopService
 * Manages emergency stop logic.
 */
class EmergencyStopService {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    this.isGlobalStopped = false;
    this.stoppedAgents = new Set();
  }

  /**
   * triggerGlobalEmergencyStop - Executes trigger global emergency stop.
   * @returns {*} Result of operation.
   */
  triggerGlobalEmergencyStop() {
    this.isGlobalStopped = true;
    return Object.freeze({ isGlobalStopped: true, stoppedAt: new Date().toISOString() });
  }

  /**
   * suspendAgent - Executes suspend agent.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  suspendAgent(agentId) {
    this.stoppedAgents.add(agentId);
    return Object.freeze({ agentId, status: 'SUSPENDED' });
  }

  /**
   * isAgentAllowed - Executes is agent allowed.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  isAgentAllowed(agentId) {
    if (this.isGlobalStopped) return false;
    return !this.stoppedAgents.has(agentId);
  }
}

module.exports = EmergencyStopService;
