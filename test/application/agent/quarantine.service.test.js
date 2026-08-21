'use strict';

const QuarantineService = require('../../../src/services/ai/lifecycle/quarantine.service');

describe('T145: Agent Quarantine and Investigation Mode Service', () => {
  test('quarantines agent, revokes credentials, preserves evidence, and opens investigation', () => {
    const mockSm = { transitionState: jest.fn() };
    const service = new QuarantineService({ lifecycleStateMachineService: mockSm });

    const result = service.quarantineAgent({ agentId: 'dan_rnd', reason: 'Unsafe code proposal detected' });

    expect(result.status).toBe('QUARANTINED');
    expect(result.credentialsRevoked).toBe(true);
    expect(result.investigationId).toBeDefined();
  });
});
