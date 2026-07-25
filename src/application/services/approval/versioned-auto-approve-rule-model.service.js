'use strict';

class VersionedAutoApproveRuleModelService {
  constructor() {
    this.rules = new Map();
  }

  createRule({ actionScope, amountCapUSD = 500, minConfidence = 0.9, reliabilityThreshold = 0.95, owner = 'CEO', version = 'v1.0' }) {
    const ruleId = `rule_auto_${Math.random().toString(36).substr(2, 9)}`;
    const rule = Object.freeze({
      ruleId,
      actionScope,
      amountCapUSD,
      minConfidence,
      reliabilityThreshold,
      owner,
      version,
      expiry: new Date(Date.now() + 864000000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    this.rules.set(ruleId, rule);
    return rule;
  }
}

module.exports = VersionedAutoApproveRuleModelService;
