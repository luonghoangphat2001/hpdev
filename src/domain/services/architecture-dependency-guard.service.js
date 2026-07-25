'use strict';

class ArchitectureDependencyGuardService {
  verifyLayerDependencies({ sourceLayer, targetLayer }) {
    // Rules: domain cannot import application or infrastructure
    if (sourceLayer === 'domain' && (targetLayer === 'application' || targetLayer === 'infrastructure')) {
      return Object.freeze({ valid: false, error: 'Domain layer cannot depend on application or infrastructure' });
    }
    if (sourceLayer === 'application' && targetLayer === 'infrastructure') {
      return Object.freeze({ valid: false, error: 'Application layer should depend on infrastructure abstractions, not implementations directly' });
    }

    return Object.freeze({ valid: true, error: null });
  }
}

module.exports = ArchitectureDependencyGuardService;
