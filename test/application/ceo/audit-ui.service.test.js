'use strict';

const AuditUiService = require('@services/ceo/exception/audit-ui.service');

describe('T138: CEO-Only Security, Confirmation, and Audit UI Service', () => {
  test('verifies CEO session hardening and returns audit history', async () => {
    const service = new AuditUiService({});
    const session = await service.verifyCeoSession('ceo_secret_token_123');
    const audit = await service.getAuditHistory();

    expect(session.authenticated).toBe(true);
    expect(session.role).toBe('CEO');
    expect(audit.length).toBeGreaterThan(0);
  });
});
