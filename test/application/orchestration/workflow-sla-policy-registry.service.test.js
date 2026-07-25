'use strict';

const WorkflowSlaPolicyRegistryService = require('../../../src/application/services/orchestration/workflow-sla-policy-registry.service');

describe('T197: WorkflowSlaPolicy Registry Service', () => {
  test('manages versioned SLA, timeout, token, cost, and fallback policies by workflow type', () => {
    const service = new WorkflowSlaPolicyRegistryService();
    const policy = service.getPolicy({ workflowType: 'ECOM_ORDER_WORKFLOW' });

    expect(policy.maxTimeoutMs).toBe(10000);
    expect(policy.maxCostUSD).toBe(0.5);
    expect(policy.version).toBe('v1.0');
  });
});
