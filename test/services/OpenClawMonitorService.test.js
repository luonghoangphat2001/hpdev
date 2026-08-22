'use strict';

const OpenClawMonitorService = require('../../src/services/openclaw/OpenClawMonitorService');

describe('T122 supplemental: OpenClaw Monitor Service', () => {
  test('loads overview from OpenClaw and legacy interactions from local repository', async () => {
    const client = {
      getDashboardOverview: jest.fn().mockResolvedValue({
        ok: true,
        overview: { status: 'UP' },
      }),
      getDashboardAgents: jest.fn().mockResolvedValue({
        ok: true,
        agents: [{ agentId: 'dan_ops' }],
      }),
    };
    const repository = {
      findRecent: jest.fn().mockResolvedValue([{ id: 1 }]),
      count: jest.fn().mockResolvedValue(1),
    };
    client.controlDashboardAgent = jest.fn().mockResolvedValue({
      ok: true,
      agent: { lifecycleState: 'PAUSED' },
    });
    client.getDashboardWorkflows = jest.fn().mockResolvedValue({
      ok: true,
      workflows: [{ workflowId: 'wfl-1' }],
      total: 1,
    });
    client.getDashboardWorkflowDetail = jest.fn().mockResolvedValue({
      ok: true,
      detail: { workflow: { workflowId: 'wfl-1' } },
    });
    const service = new OpenClawMonitorService(client, repository, {
      ceoActorId: 'ceo-dashboard',
    });

    await expect(service.getOverview()).resolves.toMatchObject({
      overview: { status: 'UP' },
    });
    await expect(service.getAgents()).resolves.toMatchObject({
      agents: [{ agentId: 'dan_ops' }],
    });
    await expect(service.listInteractions(30, 0)).resolves.toEqual({
      logs: [{ id: 1 }],
      total: 1,
    });
    await service.controlAgent({
      agentId: 'dan_ops',
      toState: 'PAUSED',
      expectedVersion: 2,
      reason: 'Investigate failure',
    });
    expect(client.controlDashboardAgent).toHaveBeenCalledWith('dan_ops', {
      toState: 'PAUSED',
      expectedVersion: 2,
      actorId: 'ceo-dashboard',
      reason: 'Investigate failure',
    });
    await expect(service.getWorkflows({ agentId: 'dan_ops' })).resolves.toMatchObject({
      total: 1,
    });
    await expect(service.getWorkflowDetail('wfl-1')).resolves.toMatchObject({
      detail: { workflow: { workflowId: 'wfl-1' } },
    });
  });

  test('safely enriches agents when response is an object with agents array and configRepo is present', async () => {
    const client = {
      getDashboardOverview: jest.fn(),
      getDashboardAgents: jest.fn().mockResolvedValue({
        ok: true,
        count: 1,
        agents: [{ agentId: 'dan_rnd' }],
      }),
    };
    const mockConfigRepo = {
      get: jest.fn((k) => {
        if (k === 'agent_dan_rnd_primary') return 'gemini:models/gemini-2.5-flash';
        if (k === 'agent_dan_rnd_fallback') return 'claude:claude-sonnet-4-6';
        return null;
      }),
    };
    const service = new OpenClawMonitorService(client, null, {
      ceoActorId: 'ceo-dashboard',
      configRepo: mockConfigRepo,
    });

    const result = await service.getAgents();
    expect(result.ok).toBe(true);
    expect(result.agents[0]).toMatchObject({
      agentId: 'dan_rnd',
      model: {
        primary: { provider: 'gemini', name: 'models/gemini-2.5-flash' },
        fallback: { provider: 'claude', name: 'claude-sonnet-4-6' },
      },
    });
  });
});
