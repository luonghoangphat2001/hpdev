'use strict';

class ScopedCeoAgentControlApisService {
  constructor({ centralPermissionEvaluator }) {
    this.centralPermissionEvaluator = centralPermissionEvaluator;
  }

  handleControlRequest({ userRole, scope, action, payload }) {
    if (this.centralPermissionEvaluator) {
      const auth = this.centralPermissionEvaluator.canExecuteAction({ subjectRole: userRole, action, resource: scope });
      if (!auth.allowed) {
        throw new Error(`Unauthorized scope access: ${scope} for action ${action}`);
      }
    }

    return Object.freeze({
      userRole,
      scope,
      action,
      payload,
      status: 'ACCEPTED',
      auditId: `aud_ctrl_${Math.random().toString(36).substr(2, 9)}`,
      processedAt: new Date().toISOString(),
    });
  }
}

module.exports = ScopedCeoAgentControlApisService;
