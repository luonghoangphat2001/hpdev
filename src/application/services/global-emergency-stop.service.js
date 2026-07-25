'use strict';

class GlobalEmergencyStopService {
  constructor() {
    this.isGlobalStopped = false;
    this.stoppedAgents = new Set();
  }

  triggerGlobalEmergencyStop() {
    this.isGlobalStopped = true;
    return Object.freeze({ isGlobalStopped: true, stoppedAt: new Date().toISOString() });
  }

  suspendAgent(agentId) {
    this.stoppedAgents.add(agentId);
    return Object.freeze({ agentId, status: 'SUSPENDED' });
  }

  isAgentAllowed(agentId) {
    if (this.isGlobalStopped) return false;
    return !this.stoppedAgents.has(agentId);
  }
}

module.exports = GlobalEmergencyStopService;
