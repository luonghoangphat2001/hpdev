'use strict';

const SopPolicyAutonomyEditorService = require('../../src/application/services/sop-policy-autonomy-editor.service');

describe('T135: SOP, Policy, and Autonomy Viewer and Editor Service', () => {
  test('retrieves policy details and submits proposed change request', () => {
    const service = new SopPolicyAutonomyEditorService({});
    const details = service.getPolicyDetails('pol_cfo_01');
    const changeReq = service.proposeChange({
      policyId: 'pol_cfo_01',
      newAutonomyLevel: 'FULLY_AUTOMATIC',
      reason: 'Proven accuracy above 99%',
    });

    expect(details.version).toBe('v1.2');
    expect(changeReq.status).toBe('PENDING_APPROVAL');
    expect(changeReq.proposedLevel).toBe('FULLY_AUTOMATIC');
  });
});
