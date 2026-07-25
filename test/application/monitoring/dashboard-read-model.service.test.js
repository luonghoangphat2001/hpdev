'use strict';

const DashboardReadModelService =
  require('../../../src/application/services/monitoring/dashboard-read-model.service');

describe('T122 supplemental: Dashboard Read Model Service', () => {
  test('returns database-backed operational counts and live metrics', async () => {
    const dashboardRepository = {
      getOverview: jest.fn().mockResolvedValue({
        activeWorkflowCount: 2,
        pendingApprovalCount: 1,
        unresolvedDeadLetterCount: 0,
        openExceptionCount: 3,
      }),
    };
    const metricsRegistry = {
      snapshot: jest.fn().mockReturnValue({ counters: { requests: 9 } }),
    };
    const service = new DashboardReadModelService({
      dashboardRepository,
      metricsRegistry,
      productionEnabled: false,
    });

    const result = await service.getOverview();

    expect(result.operationalCounts.activeWorkflowCount).toBe(2);
    expect(result.metrics.counters.requests).toBe(9);
    expect(result.productionEnabled).toBe(false);
    expect(dashboardRepository.getOverview).toHaveBeenCalledTimes(1);
  });

  test('reports the authenticated company Dashboard connection without exposing credentials', async () => {
    const dashboardRepository = {
      getOverview: jest.fn().mockResolvedValue({ activeWorkflowCount: 0 }),
    };
    const ssotClient = {
      ping: jest.fn().mockResolvedValue({
        integration: {
          status: 'UP',
          api_version: 'v1',
          agent: { code: 'openclaw-orchestrator', department: 'ops' },
          operational_summary: { products: 30, orders: 0, active_agents: 7 },
          checked_at: '2026-07-25T10:00:00+07:00',
        },
      }),
    };
    const service = new DashboardReadModelService({
      dashboardRepository,
      ssotClient,
      companyDashboardUrl: 'https://dashboard.hpdev.name.vn',
    });

    const result = await service.getOverview();

    expect(result.companyDashboard).toMatchObject({
      status: 'UP',
      baseUrl: 'https://dashboard.hpdev.name.vn',
      apiVersion: 'v1',
      agent: { code: 'openclaw-orchestrator' },
      operationalSummary: { products: 30 },
    });
    expect(result.companyDashboard).not.toHaveProperty('agentToken');
  });

  test('degrades only the company Dashboard integration when its API is unavailable', async () => {
    const dashboardRepository = {
      getOverview: jest.fn().mockResolvedValue({ activeWorkflowCount: 0 }),
    };
    const ssotClient = {
      ping: jest.fn().mockRejectedValue({ code: 'ssot_timeout' }),
    };
    const service = new DashboardReadModelService({
      dashboardRepository,
      ssotClient,
      companyDashboardUrl: 'https://dashboard.hpdev.name.vn',
    });

    const result = await service.getOverview();

    expect(result.status).toBe('UP');
    expect(result.companyDashboard).toEqual({
      status: 'DEGRADED',
      baseUrl: 'https://dashboard.hpdev.name.vn',
      errorCode: 'ssot_timeout',
    });
  });

  test('merges five registered agent profiles with database activity', async () => {
    const dashboardRepository = {
      getOverview: jest.fn(),
      getAgentSummaries: jest.fn().mockResolvedValue([
        {
          agentId: 'dan_ops',
          workflowCount: 7,
          activeWorkflowCount: 2,
          failedWorkflowCount: 1,
          lastActivityAt: '2026-07-25T10:00:00.000Z',
          lifecycleStatus: 'ACTIVE',
          stateVersion: 2,
        },
      ]),
    };
    const agentRegistry = {
      list: () => [
        { id: 'dan_ops', department: 'operations', mission: 'ops', version: '1', capabilities: [], permissions: [] },
        { id: 'dan_cfo', department: 'finance', mission: 'finance', version: '1', capabilities: [], permissions: [] },
      ],
    };
    const service = new DashboardReadModelService({
      dashboardRepository,
      agentRegistry,
    });

    const agents = await service.getAgents();

    expect(agents).toHaveLength(2);
    expect(agents[0]).toMatchObject({
      agentId: 'dan_ops',
      activityStatus: 'BUSY',
      activeWorkflowCount: 2,
      lifecycleStatus: 'ACTIVE',
      stateVersion: 2,
    });
    expect(agents[1]).toMatchObject({
      agentId: 'dan_cfo',
      activityStatus: 'IDLE',
      workflowCount: 0,
      lifecycleStatus: 'UNKNOWN',
    });
  });

  test('returns bounded filterable workflow summaries', async () => {
    const dashboardRepository = {
      getOverview: jest.fn(),
      listWorkflows: jest.fn().mockResolvedValue({
        total: 1,
        rows: [{
          workflow_id: 'wfl-1',
          correlation_id: 'cor-1',
          workflow_type: 'order.sla',
          state: 'running',
          state_version: 3,
          assigned_agent_id: 'dan_ops',
          risk_level: 'medium',
          priority: 80,
          created_at: '2026-07-25T10:00:00.000Z',
          updated_at: '2026-07-25T10:01:00.000Z',
        }],
      }),
    };
    const service = new DashboardReadModelService({ dashboardRepository });

    const result = await service.getWorkflows({
      limit: 500,
      agentId: 'dan_ops',
      state: 'running',
      search: 'sla',
    });

    expect(result.limit).toBe(200);
    expect(result.workflows[0]).toMatchObject({
      workflowId: 'wfl-1',
      assignedAgentId: 'dan_ops',
      stateVersion: 3,
    });
    expect(dashboardRepository.listWorkflows).toHaveBeenCalledWith(expect.objectContaining({
      limit: 200,
      agentId: 'dan_ops',
      state: 'running',
      search: 'sla',
    }));
  });

  test('returns a sanitized workflow detail timeline without raw payload columns', async () => {
    const dashboardRepository = {
      getOverview: jest.fn(),
      getWorkflowDetail: jest.fn().mockResolvedValue({
        workflow: { workflow_id: 'wfl-1', state_version: 2, state: 'running' },
        actions: [{ action_id: 'act-1', action_name: 'order.read' }],
        approvals: [{ approval_id: 'apr-1', decision_version: 1 }],
        timeline: [{ audit_id: 'aud-1', from_state: 'queued', to_state: 'running' }],
      }),
    };
    const service = new DashboardReadModelService({ dashboardRepository });

    const detail = await service.getWorkflowDetail('wfl-1');

    expect(detail.workflow).toEqual({
      workflowId: 'wfl-1',
      stateVersion: 2,
      state: 'running',
    });
    expect(detail.actions[0]).toMatchObject({ actionId: 'act-1' });
    expect(detail.approvals[0]).toMatchObject({ approvalId: 'apr-1' });
    expect(detail.timeline[0]).toMatchObject({ fromState: 'queued', toState: 'running' });
  });
});
