'use strict';

const ArchitectureDependencyGuardService = require('../../src/domain/services/architecture-dependency-guard.service');

describe('T113: Architecture/Lint Dependency Guard Service', () => {
  test('prevents reverse layer imports', () => {
    const guard = new ArchitectureDependencyGuardService();
    expect(guard.verifyLayerDependencies({ sourceLayer: 'domain', targetLayer: 'infrastructure' }).valid).toBe(false);
    expect(guard.verifyLayerDependencies({ sourceLayer: 'application', targetLayer: 'domain' }).valid).toBe(true);
  });
});
