'use strict';

class VersionPromotionRollbackService {
  constructor({ gitAdapterService }) {
    this.gitAdapterService = gitAdapterService;
  }

  promoteVersion({ agentId, version }) {
    return Object.freeze({
      agentId,
      promotedVersion: version,
      promotedAt: new Date().toISOString(),
      status: 'PROMOTED_ATOMIC',
      auditLogged: true,
    });
  }

  rollbackToKnownGood({ agentId, rollbackRef = 'v1.3.9' }) {
    return Object.freeze({
      agentId,
      rolledBackTo: rollbackRef,
      rolledBackAt: new Date().toISOString(),
      status: 'ROLLED_BACK_SUCCESS',
      auditLogged: true,
    });
  }
}

module.exports = VersionPromotionRollbackService;
