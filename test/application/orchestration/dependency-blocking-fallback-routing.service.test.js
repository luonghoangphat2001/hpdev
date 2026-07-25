'use strict';

const DependencyBlockingFallbackRoutingService = require('../../../src/application/services/orchestration/dependency-blocking-fallback-routing.service');

describe('T146: Dependency Blocking and Approved Fallback Routing Service', () => {
  test('blocks workflow and routes to fallback agent when primary agent is quarantined', () => {
    const mockSm = { getAgentState: jest.fn().mockReturnValue('QUARANTINED') };
    const service = new DependencyBlockingFallbackRoutingService({ lifecycleStateMachineService: mockSm });

    const res = service.routeWorkflowWithFallback({ agentId: 'dan_ops', workflowTask: 'PO_APPROVAL' });

    expect(res.blocked).toBe(true);
    expect(res.fallbackRouted).toBe(true);
    expect(res.assignedFallbackAgent).toBe('dan_cfo');
  });
});
