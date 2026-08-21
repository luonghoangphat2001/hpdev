'use strict';

const SlaPolicy = require('../../../src/policy/permissions/sla.policy');

describe('T197: WorkflowSlaPolicy Registry Service', () => {
  test('manages versioned SLA, timeout, token, cost, and fallback policies by workflow type', () => {
    const service = new SlaPolicy();
    const policy = service.getPolicy({ workflowType: 'ECOM_ORDER_WORKFLOW' });

    expect(policy.maxTimeoutMs).toBe(10000);
    expect(policy.maxCostUSD).toBe(0.5);
    expect(policy.version).toBe('v1.0');
  });
});
