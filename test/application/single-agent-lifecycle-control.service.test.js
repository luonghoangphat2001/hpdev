'use strict';

const SingleAgentLifecycleControlService = require('../../src/application/services/single-agent-lifecycle-control.service');

describe('T144: Single-Agent Pause/Suspend/Resume Control Service', () => {
  test('pauses and resumes single agent without affecting others', () => {
    const mockSm = { transitionState: jest.fn().mockImplementation(({ agentId, toState }) => ({ agentId, state: toState })) };
    const service = new SingleAgentLifecycleControlService({ lifecycleStateMachineService: mockSm });

    const paused = service.pauseAgent({ agentId: 'dan_ops', reason: 'High queue drain' });
    expect(paused.state).toBe('PAUSED');

    const resumed = service.resumeAgent({ agentId: 'dan_ops', reason: 'Queue drained' });
    expect(resumed.state).toBe('ACTIVE');
  });
});
