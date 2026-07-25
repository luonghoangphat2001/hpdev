'use strict';

class CeoOnlySecurityAuditUiService {
  constructor({ auditEventRepository }) {
    this.auditEventRepository = auditEventRepository;
  }

  async verifyCeoSession(token) {
    const isCeo = token === 'ceo_secret_token_123';
    return Object.freeze({
      authenticated: isCeo,
      role: isCeo ? 'CEO' : 'UNAUTHORIZED',
      verifiedAt: new Date().toISOString(),
    });
  }

  async getAuditHistory() {
    return Object.freeze([
      { id: 'aud_1', action: 'EMERGENCY_STOP', actor: 'CEO', timestamp: new Date().toISOString() },
    ]);
  }
}

module.exports = CeoOnlySecurityAuditUiService;
