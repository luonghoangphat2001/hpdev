/**
 * @fileoverview risk-evaluator - Provides risk-evaluator functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

const actionCatalog = require('@schemas/workflow/action.catalog');
const riskCatalog = require('@schemas/policy/risk.catalog');
const {
  APPROVAL_MODES,
  DEFAULT_THRESHOLDS,
  RISK_LEVELS,
  RISK_POLICY_VERSION,
} = require('@schemas/policy/risk.catalog');

/**
 * RiskEvaluator
 * Manages risk evaluator logic.
 */
class RiskEvaluator extends BasePolicy {
  constructor({
    actions = actionCatalog,
    policies = riskCatalog,
    thresholds = DEFAULT_THRESHOLDS,
  } = {}) {
    super({ name: 'RiskEvaluator' });


    this.actions = actions;
    this.policies = policies;
    this.thresholds = thresholds;
  }

  /**
   * evaluate - Executes evaluate.
   * @param {*} actionName - Input parameter.
   * @param {*} payload - Input parameter.
   * @param {*} grantedPermissions - Input parameter.
   * @returns {*} Result of operation.
   */
  evaluate({ actionName, payload = {}, grantedPermissions = [] }) {
    const action = this.actions.get(actionName);
    if (!action) {
      return this.deny(actionName, 'unknown_action');
    }

    if (!grantedPermissions.includes(action.permission)) {
      return this.deny(actionName, 'permission_not_granted', {
        required_permission: action.permission,
      });
    }

    const policy = this.policies.get(actionName);
    const missingFields = policy.conditions
      .map(({ field }) => field)
      .filter((field) => payload[field] === undefined || payload[field] === null);
    if (missingFields.length > 0) {
      return this.deny(actionName, 'missing_policy_fields', {
        missing_fields: [...new Set(missingFields)],
      });
    }

    const invalidFields = policy.conditions
      .filter((condition) => !this.isConditionValueValid(
        condition,
        payload[condition.field],
      ))
      .map(({ field }) => field);
    if (invalidFields.length > 0) {
      return this.deny(actionName, 'invalid_policy_fields', {
        invalid_fields: [...new Set(invalidFields)],
      });
    }

    const matched = policy.conditions.filter((condition) => (
      this.matches(condition, payload[condition.field])
    ));
    const riskLevel = matched.reduce(
      (risk, condition) => this.maxRisk(risk, condition.escalatesTo),
      policy.baseRisk,
    );
    const requiresApproval = policy.approval === APPROVAL_MODES.ALWAYS
      || (policy.approval === APPROVAL_MODES.CONDITIONAL && matched.length > 0);

    return Object.freeze({
      decision: requiresApproval ? 'require_approval' : 'allow',
      action: actionName,
      permission: action.permission,
      risk_level: riskLevel,
      approval_mode: policy.approval,
      matched_conditions: Object.freeze(matched.map((condition) => condition.field)),
      policy_version: RISK_POLICY_VERSION,
    });
  }

  /**
   * matches - Executes matches.
   * @param {*} condition - Input parameter.
   * @param {*} value - Input parameter.
   * @returns {*} Result of operation.
   */
  matches(condition, value) {
    const expected = condition.thresholdKey
      ? this.thresholds[condition.thresholdKey]
      : condition.value;

    if (expected === undefined) {
      throw new TypeError(`Missing risk threshold: ${condition.thresholdKey}`);
    }

    switch (condition.operator) {
      case 'gte':
        return Number(value) >= Number(expected);
      case 'lt':
        return Number(value) < Number(expected);
      case 'in':
        return expected.includes(value);
      default:
        throw new TypeError(`Unsupported risk operator: ${condition.operator}`);
    }
  }

  /**
   * isConditionValueValid - Executes is condition value valid.
   * @param {*} condition - Input parameter.
   * @param {*} value - Input parameter.
   * @returns {*} Result of operation.
   */
  isConditionValueValid(condition, value) {
    if (condition.operator === 'gte' || condition.operator === 'lt') {
      return typeof value === 'number' && Number.isFinite(value);
    }
    if (condition.operator === 'in') {
      return typeof value === 'string';
    }
    return false;
  }

  /**
   * maxRisk - Executes max risk.
   * @param {*} current - Input parameter.
   * @param {*} candidate - Input parameter.
   * @returns {*} Result of operation.
   */
  maxRisk(current, candidate) {
    return RISK_LEVELS.indexOf(candidate) > RISK_LEVELS.indexOf(current)
      ? candidate
      : current;
  }

  /**
   * deny - Executes deny.
   * @param {*} actionName - Input parameter.
   * @param {*} reason - Input parameter.
   * @param {*} details - Input parameter.
   * @returns {*} Result of operation.
   */
  deny(actionName, reason, details = {}) {
    return Object.freeze({
      decision: 'deny',
      action: actionName,
      risk_level: 'critical',
      reason,
      policy_version: RISK_POLICY_VERSION,
      ...details,
    });
  }
}

module.exports = RiskEvaluator;
