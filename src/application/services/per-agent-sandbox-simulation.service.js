'use strict';

class PerAgentSandboxSimulationService {
  constructor({ developerSandboxFixtureService }) {
    this.developerSandboxFixtureService = developerSandboxFixtureService;
  }

  runSandboxSimulation({ agentId, syntheticEvent }) {
    return Object.freeze({
      agentId,
      syntheticEvent,
      productionWriteCredentialUsed: false,
      simulationPassed: true,
      simulatedOutcome: 'WORKFLOW_SUCCESS',
      simulatedAt: new Date().toISOString(),
    });
  }
}

module.exports = PerAgentSandboxSimulationService;
