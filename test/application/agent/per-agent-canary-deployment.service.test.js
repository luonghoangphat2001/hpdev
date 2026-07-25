'use strict';

const PerAgentCanaryDeploymentService = require('../../../src/application/services/agent/per-agent-canary-deployment.service');

describe('T158: Per-Agent Canary Deployment Service', () => {
  test('starts canary deployment with configured traffic ratio and metrics comparison', () => {
    const service = new PerAgentCanaryDeploymentService();
    const canary = service.startCanaryDeployment({
      agentId: 'dan_logistics',
      canaryRatioPercent: 15,
      targetVersion: 'v1.5.0-rc1',
    });

    expect(canary.status).toBe('CANARY_RUNNING');
    expect(canary.canaryRatioPercent).toBe(15);
    expect(canary.metricsBaselineMet).toBe(true);
  });
});
