'use strict';

class WorkflowSlaPolicyRegistryService {
  constructor() {
    this.policies = new Map();
    this.initDefaultPolicies();
  }

  initDefaultPolicies() {
    this.policies.set('ECOM_ORDER_WORKFLOW', Object.freeze({
      workflowType: 'ECOM_ORDER_WORKFLOW',
      maxTimeoutMs: 10000,
      maxTokenBudget: 40000,
      maxCostUSD: 0.5,
      version: 'v1.0',
    }));
  }

  getPolicy({ workflowType }) {
    return Object.freeze(this.policies.get(workflowType) || {
      workflowType,
      maxTimeoutMs: 15000,
      maxTokenBudget: 50000,
      maxCostUSD: 1.0,
      version: 'v1.0-default',
    });
  }
}

module.exports = WorkflowSlaPolicyRegistryService;
