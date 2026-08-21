'use strict';

const ContractFreezePolicy = require('../../../src/policy/compliance/contract-freeze.policy');

describe('T120: Control Plane API/UI Contract Freeze Service', () => {
  test('returns frozen contract spec with locked endpoints and scopes', () => {
    const service = new ContractFreezePolicy();
    const spec = service.getFrozenContractSpec();

    expect(spec.version).toBe('1.0.0-FROZEN');
    expect(spec.readEndpoints).toContain('/api/overview');
    expect(spec.permissionScopes).toContain('CEO_FULL_CONTROL');
  });
});
