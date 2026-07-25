'use strict';

const RbacAbacSchemaService = require('../../../src/application/services/compliance/rbac-abac-schema.service');

describe('T141: RBAC/ABAC Permission Schema Service', () => {
  test('evaluates permissions correctly based on role', () => {
    const service = new RbacAbacSchemaService();

    const ceoRes = service.evaluatePermission({ userRole: 'CEO', requiredPermission: 'CEO_FULL_CONTROL' });
    expect(ceoRes.granted).toBe(true);

    const viewerRes = service.evaluatePermission({ userRole: 'VIEWER', requiredPermission: 'SAFE_CONTROL_ACTION' });
    expect(viewerRes.granted).toBe(false);
  });
});
