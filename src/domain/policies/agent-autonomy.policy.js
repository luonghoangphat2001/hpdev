'use strict';

const LEVELS = Object.freeze([
  'OBSERVE',
  'PROPOSE',
  'EXECUTE_LOW_RISK',
  'FULL_WITH_LIMITS',
]);

class AgentAutonomyPolicy {
  authorize({
    settings,
    operation,
    riskDecision = null,
    usage = {},
    approval = null,
  }) {
    if (!settings?.enabled) return this.#deny('agent_disabled');
    if (!LEVELS.includes(settings.autonomyLevel)) return this.#deny('autonomy_level_invalid');
    if (operation === 'observe') return this.#allow();
    if (operation === 'propose') {
      return settings.autonomyLevel === 'OBSERVE'
        ? this.#deny('observe_only')
        : this.#allow();
    }
    if (operation !== 'execute') return this.#deny('operation_unknown');
    if (['OBSERVE', 'PROPOSE'].includes(settings.autonomyLevel)) {
      return this.#deny('execution_not_allowed');
    }
    if (!riskDecision || riskDecision.decision === 'deny') {
      return this.#deny('risk_policy_denied');
    }
    if (settings.autonomyLevel === 'EXECUTE_LOW_RISK'
      && (riskDecision.risk_level !== 'low' || riskDecision.decision !== 'allow')) {
      return this.#deny('low_risk_only');
    }
    if (riskDecision.decision === 'require_approval'
      && approval?.status !== 'consumed') {
      return this.#deny('approval_required');
    }
    const violation = this.#limitViolation(settings.limits || {}, usage);
    return violation ? this.#deny(violation) : this.#allow();
  }

  #limitViolation(limits, usage) {
    const checks = [
      ['maxAmountPerAction', 'amount', 'amount_limit_exceeded'],
      ['maxDailyAmount', 'dailyAmount', 'daily_amount_limit_exceeded'],
      ['maxDailyActions', 'dailyActions', 'daily_action_limit_exceeded'],
      ['maxTokensPerWorkflow', 'tokens', 'token_limit_exceeded'],
    ];
    const failed = checks.find(([limit, value]) =>
      limits[limit] !== undefined
      && Number(usage[value] || 0) > Number(limits[limit]));
    return failed?.[2] || null;
  }

  #allow() {
    return Object.freeze({ allowed: true, reason: null });
  }

  #deny(reason) {
    return Object.freeze({ allowed: false, reason });
  }
}

module.exports = AgentAutonomyPolicy;
module.exports.LEVELS = LEVELS;
