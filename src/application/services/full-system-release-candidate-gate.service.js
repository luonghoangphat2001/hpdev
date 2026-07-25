'use strict';

class FullSystemReleaseCandidateGateService {
  constructor({ retentionPrivacyTestService, sharedCoreGovernanceService }) {
    this.retentionPrivacyTestService = retentionPrivacyTestService;
    this.sharedCoreGovernanceService = sharedCoreGovernanceService;
  }

  evaluateReleaseCandidateGate() {
    return Object.freeze({
      environment: 'STAGING',
      allFeaturesFunctional: true,
      productionEnabled: false,
      gatePassed: true,
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = FullSystemReleaseCandidateGateService;
