'use strict';

const PerAgentSandboxSimulationService = require('../../../src/application/services/agent/per-agent-sandbox-simulation.service');

describe('T157: Per-Agent Sandbox Simulation Service', () => {
  test('runs synthetic event simulation without production credentials', () => {
    const service = new PerAgentSandboxSimulationService({});
    const res = service.runSandboxSimulation({ agentId: 'dan_cfo', syntheticEvent: { type: 'TEST_INVOICE' } });

    expect(res.simulationPassed).toBe(true);
    expect(res.productionWriteCredentialUsed).toBe(false);
  });
});
