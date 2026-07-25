'use strict';

class PerAgentCredentialRevokeRotateService {
  constructor({ secretRotationService }) {
    this.secretRotationService = secretRotationService;
  }

  revokeAgentCredential({ agentId, credentialKey }) {
    return Object.freeze({
      agentId,
      credentialKey,
      revoked: true,
      revokedAt: new Date().toISOString(),
    });
  }

  rotateAgentCredential({ agentId, credentialKey }) {
    const newCredentialSecret = `sec_${agentId}_${Math.random().toString(36).substr(2, 9)}`;

    return Object.freeze({
      agentId,
      credentialKey,
      rotated: true,
      newCredentialSecret,
      rotatedAt: new Date().toISOString(),
    });
  }
}

module.exports = PerAgentCredentialRevokeRotateService;
