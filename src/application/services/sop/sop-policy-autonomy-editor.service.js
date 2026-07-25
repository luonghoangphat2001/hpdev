'use strict';

class SopPolicyAutonomyEditorService {
  constructor({ featureFlagService }) {
    this.featureFlagService = featureFlagService;
  }

  getPolicyDetails(policyId) {
    return Object.freeze({
      policyId,
      version: 'v1.2',
      autonomyLevel: 'SEMI_AUTOMATIC',
      content: 'Standard operating policy content for OpenClaw orchestrator',
      lastModifiedAt: new Date().toISOString(),
    });
  }

  proposeChange({ policyId, newAutonomyLevel, reason }) {
    return Object.freeze({
      changeRequestId: `req_pol_${Math.random().toString(36).substr(2, 9)}`,
      policyId,
      proposedLevel: newAutonomyLevel,
      reason,
      status: 'PENDING_APPROVAL',
      submittedAt: new Date().toISOString(),
    });
  }
}

module.exports = SopPolicyAutonomyEditorService;
