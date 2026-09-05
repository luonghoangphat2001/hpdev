/**
 * @fileoverview rbac.policy - Provides rbac functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * RbacPolicy
 * Manages rbac logic.
 */
class RbacPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    super({ name: 'RbacPolicy' });


    this.roles = Object.freeze({
      CEO: ['CEO_FULL_CONTROL', 'APPROVAL_DECISION', 'SAFE_CONTROL_ACTION'],
      OPERATOR: ['VIEW_MONITOR', 'PAUSE_AGENT', 'RESUME_AGENT'],
      VIEWER: ['VIEW_MONITOR'],
    });
  }

  /**
   * evaluatePermission - Executes evaluate permission.
   * @param {*} userRole - Input parameter.
   * @param {*} requiredPermission - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = RbacPolicy;
