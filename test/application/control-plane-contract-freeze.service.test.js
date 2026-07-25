'use strict';

const ControlPlaneContractFreezeService = require('../../src/application/services/control-plane-contract-freeze.service');

describe('T120: Control Plane API/UI Contract Freeze Service', () => {
  test('returns frozen contract spec with locked endpoints and scopes', () => {
    const service = new ControlPlaneContractFreezeService();
    const spec = service.getFrozenContractSpec();

    expect(spec.version).toBe('1.0.0-FROZEN');
    expect(spec.readEndpoints).toContain('/api/overview');
    expect(spec.permissionScopes).toContain('CEO_FULL_CONTROL');
  });
});
