/**
 * @fileoverview scoped-control.service - Provides scoped-control functionality.
 */
'use strict';

/**
 * ScopedControlService
 * Manages scoped control logic.
 */
class ScopedControlService {
  /**
   * constructor - Executes constructor.
   * @param {*} centralPermissionEvaluator - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ centralPermissionEvaluator }) {
    this.centralPermissionEvaluator = centralPermissionEvaluator;
  }

  /**
   * handleControlRequest - Executes handle control request.
   * @param {*} userRole - Input parameter.
   * @param {*} scope - Input parameter.
   * @param {*} action - Input parameter.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = ScopedControlService;
