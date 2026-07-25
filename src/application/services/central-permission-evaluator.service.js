'use strict';

class CentralPermissionEvaluatorService {
  constructor({ rbacSchemaService }) {
    this.rbacSchemaService = rbacSchemaService;
  }

  canExecuteAction({ subjectRole, action, resource }) {
    if (!subjectRole) {
      return Object.freeze({ allowed: false, reason: 'DEFAULT_DENY_NO_ROLE' });
    }

    if (this.rbacSchemaService) {
      const res = this.rbacSchemaService.evaluatePermission({ userRole: subjectRole, requiredPermission: action });
      if (!res.granted) {
        return Object.freeze({ allowed: false, reason: 'ROLE_PERMISSION_NOT_GRANTED' });
      }
    }

    return Object.freeze({
      allowed: true,
      subjectRole,
      action,
      resource,
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = CentralPermissionEvaluatorService;
