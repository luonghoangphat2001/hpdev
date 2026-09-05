/**
 * @fileoverview permission-evaluator.policy - Provides permission-evaluator functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * PermissionEvaluatorPolicy
 * Manages permission evaluator logic.
 */
class PermissionEvaluatorPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} rbacSchemaService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ rbacSchemaService }) {
    super({ name: 'PermissionEvaluatorPolicy' });


    this.rbacSchemaService = rbacSchemaService;
  }

  /**
   * canExecuteAction - Executes can execute action.
   * @param {*} subjectRole - Input parameter.
   * @param {*} action - Input parameter.
   * @param {*} resource - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = PermissionEvaluatorPolicy;
