'use strict';

const CeoOnlySecurityAuditUiService = require('../../../src/application/services/ceo/ceo-only-security-audit-ui.service');

describe('T138: CEO-Only Security, Confirmation, and Audit UI Service', () => {
  test('verifies CEO session hardening and returns audit history', async () => {
    const service = new CeoOnlySecurityAuditUiService({});
    const session = await service.verifyCeoSession('ceo_secret_token_123');
    const audit = await service.getAuditHistory();

    expect(session.authenticated).toBe(true);
    expect(session.role).toBe('CEO');
    expect(audit.length).toBeGreaterThan(0);
  });
});
