'use strict';

const SharedCoreChangeGovernanceService = require('../../../src/application/services/devops/shared-core-change-governance.service');

describe('T160: Shared-Core Change Governance Service', () => {
  test('evaluates shared core changes with impact analysis and approval requirements', () => {
    const service = new SharedCoreChangeGovernanceService({});
    const res = service.evaluateSharedCoreChange({ targetModule: 'src/domain/workflow-state-machine.js', impactScope: 'ALL_AGENTS' });

    expect(res.governancePassed).toBe(true);
    expect(res.regressionSuiteRequired).toBe(true);
    expect(res.ceoApprovalRequired).toBe(true);
  });
});
