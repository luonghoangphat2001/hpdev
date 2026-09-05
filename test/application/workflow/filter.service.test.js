'use strict';

const WorkflowFilterService = require('@services/workflow/state/workflow-filter.service');

describe('T127: Workflow List/Search/Filter Page Service', () => {
  test('filters workflows by agent, status, and risk level', () => {
    const service = new WorkflowFilterService();
    const workflows = [
      { id: 'w1', agent: 'dan_cfo', status: 'RUNNING', riskLevel: 'HIGH' },
      { id: 'w2', agent: 'dan_ops', status: 'COMPLETED', riskLevel: 'LOW' },
    ];

    const res = service.filterWorkflows({ workflows, agent: 'dan_cfo' });
    expect(res.total).toBe(1);
    expect(res.workflows[0].id).toBe('w1');
  });
});
