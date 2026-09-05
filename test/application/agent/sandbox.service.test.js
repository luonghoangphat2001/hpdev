'use strict';

const SandboxService = require('@services/ai/lifecycle/sandbox.service');

describe('T157: Per-Agent Sandbox Simulation Service', () => {
  test('runs synthetic event simulation without production credentials', () => {
    const service = new SandboxService({});
    const res = service.runSandboxSimulation({ agentId: 'dan_cfo', syntheticEvent: { type: 'TEST_INVOICE' } });

    expect(res.simulationPassed).toBe(true);
    expect(res.productionWriteCredentialUsed).toBe(false);
  });
});
