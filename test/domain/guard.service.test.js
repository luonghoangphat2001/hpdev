'use strict';

const DependencyGuardPolicy = require('../../src/policy/permissions/dependency-guard.policy');

describe('T113: Architecture/Lint Dependency Guard Service', () => {
  test('prevents reverse layer imports', () => {
    const guard = new DependencyGuardPolicy();
    expect(guard.verifyLayerDependencies({ sourceLayer: 'domain', targetLayer: 'infrastructure' }).valid).toBe(false);
    expect(guard.verifyLayerDependencies({ sourceLayer: 'application', targetLayer: 'domain' }).valid).toBe(true);
  });
});
