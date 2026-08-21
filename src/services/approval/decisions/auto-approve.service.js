/**
 * @fileoverview auto-approve.service - Provides auto-approve functionality.
 */
'use strict';

/**
 * AutoApproveService
 * Manages auto approve logic.
 */
class AutoApproveService {
  /**
   * constructor - Executes constructor.
   * @param {*} deterministicRiskGateService - Input parameter.
   * @param {*} versionedAutoApproveRuleModelService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ deterministicRiskGateService, versionedAutoApproveRuleModelService }) {
    this.deterministicRiskGateService = deterministicRiskGateService;
    this.versionedAutoApproveRuleModelService = versionedAutoApproveRuleModelService;
  }

  /**
   * evaluatePrecedence - Executes evaluate precedence.
   * @param {*} actionType - Input parameter.
   * @param {*} amount - Input parameter.
   * @param {*} isHardDeny - Input parameter.
   * @param {*} matchesRule - Input parameter.
   * @param {*} isManualOverridden - Input parameter.
   * @returns {*} Result of operation.
   */
  evaluatePrecedence({ actionType, amount = 0, isHardDeny = false, matchesRule = true, isManualOverridden = false }) {
    let decision = 'DEFAULT_DENY';

    if (isHardDeny) {
      decision = 'HARD_DENY';
    } else if (isManualOverridden) {
      decision = 'MANUAL';
    } else if (matchesRule) {
      decision = 'AUTO';
    }

    return Object.freeze({
      actionType,
      amount,
      decision,
      precedenceTrace: Object.freeze(['HARD_DENY', 'MANUAL', 'AUTO', 'DEFAULT_DENY']),
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = AutoApproveService;
