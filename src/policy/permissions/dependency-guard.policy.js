/**
 * @fileoverview dependency-guard.policy - Provides dependency-guard functionality.
 */
'use strict';

const BasePolicy = require('../BasePolicy');

/**
 * DependencyGuardPolicy
 * Manages dependency guard logic.
 */
class DependencyGuardPolicy extends BasePolicy {
  constructor(options = {}) {
    super({ name: 'DependencyGuardPolicy' });


  }
  /**
   * verifyLayerDependencies - Executes verify layer dependencies.
   * @param {*} sourceLayer - Input parameter.
   * @param {*} targetLayer - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = DependencyGuardPolicy;
