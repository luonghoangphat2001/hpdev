'use strict';

const OpenClawService = require('../../src/services/openclaw/OpenClawService');

describe('T122 supplemental: OpenClaw dashboard API client', () => {
  test('reads dashboard overview with service bearer authentication', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        data: { ok: true, overview: { status: 'UP' } },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await expect(service.getDashboardOverview()).resolves.toMatchObject({
      overview: { status: 'UP' },
    });
    expect(httpClient.get).toHaveBeenCalledWith(
      'https://openclaw.test/orchestrator/v1/dashboard/overview',
      expect.objectContaining({
        headers: { Authorization: 'Bearer secret' },
        timeout: 5000,
      }),
    );
  });

  test('reads five-agent dashboard cards from OpenClaw', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        data: { ok: true, agents: [{ agentId: 'dan_ops' }] },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await expect(service.getDashboardAgents()).resolves.toMatchObject({
      agents: [{ agentId: 'dan_ops' }],
    });
    expect(httpClient.get).toHaveBeenCalledWith(
      'https://openclaw.test/orchestrator/v1/dashboard/agents',
      expect.any(Object),
    );
  });

  test('extracts the company Dashboard SSOT connection for Discord queries', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          ok: true,
          overview: {
            companyDashboard: {
              status: 'UP',
              operationalSummary: { products: 30, orders: 15 },
            },
          },
        },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await expect(service.getCompanyDashboardStatus()).resolves.toMatchObject({
      status: 'UP',
      operationalSummary: { products: 30, orders: 15 },
    });
  });

  test('reads today company metrics through the OpenClaw dashboard control plane', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        data: { ok: true, integration: { metrics: { orders: 4 } } },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await expect(service.getCompanyDashboardTodayMetrics()).resolves.toMatchObject({
      integration: { metrics: { orders: 4 } },
    });
    expect(httpClient.get.mock.calls[0][0]).toContain('/orchestrator/v1/dashboard/company/today-metrics');
  });

  test('reads a selected company reporting period', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        data: { ok: true, integration: { metrics: { period: 'quarter', orders: 12 } } },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await expect(service.getCompanyDashboardMetrics('quarter')).resolves.toMatchObject({
      integration: { metrics: { period: 'quarter', orders: 12 } },
    });
    expect(httpClient.get).toHaveBeenCalledWith(
      'https://openclaw.test/orchestrator/v1/dashboard/company/metrics?period=quarter',
      expect.any(Object),
    );
  });

  test('sends a versioned lifecycle command to one agent', async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        data: { ok: true, agent: { lifecycleState: 'PAUSED' } },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await service.controlDashboardAgent('dan_ops', {
      toState: 'PAUSED',
      expectedVersion: 2,
      actorId: 'ceo-dashboard',
      reason: 'Investigate failure',
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      'https://openclaw.test/orchestrator/v1/dashboard/agents/dan_ops/control',
      expect.objectContaining({ toState: 'PAUSED', expectedVersion: 2 }),
      expect.any(Object),
    );
  });

  test('reads a filtered workflow list', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        data: { ok: true, workflows: [], total: 0 },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await service.getDashboardWorkflows({
      agentId: 'dan_ops',
      state: 'running',
      search: 'order',
    });
    expect(httpClient.get.mock.calls[0][0]).toContain(
      '/orchestrator/v1/dashboard/workflows?',
    );
    expect(httpClient.get.mock.calls[0][0]).toContain('agentId=dan_ops');
    expect(httpClient.get.mock.calls[0][0]).toContain('state=running');
    expect(httpClient.get.mock.calls[0][0]).toContain('search=order');
  });

  test('reads a sanitized workflow detail', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        data: { ok: true, detail: { workflow: { workflowId: 'wfl-1' } } },
      }),
    };
    const service = new OpenClawService('https://openclaw.test', 'secret', 5000, httpClient);

    await service.getDashboardWorkflowDetail('wfl-1');

    expect(httpClient.get).toHaveBeenCalledWith(
      'https://openclaw.test/orchestrator/v1/dashboard/workflows/wfl-1',
      expect.any(Object),
    );
  });
});
