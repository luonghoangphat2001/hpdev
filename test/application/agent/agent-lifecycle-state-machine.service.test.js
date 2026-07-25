'use strict';

const AgentLifecycleStateMachineService = require('../../../src/application/services/agent/agent-lifecycle-state-machine.service');

describe('T143: Agent Lifecycle State Machine Service', () => {
  test('transitions agent through valid lifecycle states', () => {
    const sm = new AgentLifecycleStateMachineService();

    const t1 = sm.transitionState({ agentId: 'dan_cfo', toState: 'TESTING', reason: 'Pre-deploy validation' });
    expect(t1.fromState).toBe('ACTIVE');
    expect(t1.toState).toBe('TESTING');

    const t2 = sm.transitionState({ agentId: 'dan_cfo', toState: 'QUARANTINED', reason: 'High anomaly rate' });
    expect(t2.toState).toBe('QUARANTINED');
  });

  test('rejects invalid state transition', () => {
    const sm = new AgentLifecycleStateMachineService();
    expect(() => sm.transitionState({ agentId: 'dan_cfo', toState: 'INVALID_STATE' })).toThrow('Invalid lifecycle state');
  });
});
