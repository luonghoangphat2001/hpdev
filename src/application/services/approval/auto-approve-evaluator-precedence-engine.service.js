'use strict';

class AutoApproveEvaluatorPrecedenceEngineService {
  constructor({ deterministicRiskGateService, versionedAutoApproveRuleModelService }) {
    this.deterministicRiskGateService = deterministicRiskGateService;
    this.versionedAutoApproveRuleModelService = versionedAutoApproveRuleModelService;
  }

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

module.exports = AutoApproveEvaluatorPrecedenceEngineService;
