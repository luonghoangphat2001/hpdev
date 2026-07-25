'use strict';

const PerAgentCredentialRevokeRotateService = require('../../src/application/services/per-agent-credential-revoke-rotate.service');

describe('T147: Per-Agent Credential Revoke/Rotate Service', () => {
  test('revokes and rotates specific agent credential without global downtime', () => {
    const service = new PerAgentCredentialRevokeRotateService({});

    const revoked = service.revokeAgentCredential({ agentId: 'dan_cskh', credentialKey: 'CSKH_API_KEY' });
    expect(revoked.revoked).toBe(true);

    const rotated = service.rotateAgentCredential({ agentId: 'dan_cskh', credentialKey: 'CSKH_API_KEY' });
    expect(rotated.rotated).toBe(true);
    expect(rotated.newCredentialSecret).toBeDefined();
  });
});
