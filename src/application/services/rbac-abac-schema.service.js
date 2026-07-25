'use strict';

class RbacAbacSchemaService {
  constructor() {
    this.roles = Object.freeze({
      CEO: ['CEO_FULL_CONTROL', 'APPROVAL_DECISION', 'SAFE_CONTROL_ACTION'],
      OPERATOR: ['VIEW_MONITOR', 'PAUSE_AGENT', 'RESUME_AGENT'],
      VIEWER: ['VIEW_MONITOR'],
    });
  }

  evaluatePermission({ userRole, requiredPermission }) {
    const permissions = this.roles[userRole] || [];
    const granted = permissions.includes(requiredPermission);

    return Object.freeze({
      userRole,
      requiredPermission,
      granted,
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = RbacAbacSchemaService;
