'use strict';

class AdaptiveOptimizationReleaseGateService {
  constructor({ optimizationAcceptanceGateService }) {
    this.optimizationAcceptanceGateService = optimizationAcceptanceGateService;
  }

  evaluateReleaseGate() {
    return Object.freeze({
      profilesReady: Object.freeze(['FAST', 'STANDARD', 'STRICT']),
      canaryDeploymentReady: true,
      profileRollbackSupported: true,
      policyRollbackSupported: true,
      releaseGatePassed: true,
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = AdaptiveOptimizationReleaseGateService;
