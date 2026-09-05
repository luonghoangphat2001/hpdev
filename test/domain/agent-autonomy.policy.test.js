'use strict';

const AgentAutonomyPolicy = require('@policy/permissions/agent-autonomy.policy');

describe('AgentAutonomyPolicy', () => {
  const policy = new AgentAutonomyPolicy();

  test.each([
    ['OBSERVE', 'observe', true],
    ['OBSERVE', 'propose', false],
    ['PROPOSE', 'propose', true],
    ['PROPOSE', 'execute', false],
  ])('%s controls %s as expected', (autonomyLevel, operation, allowed) => {
    expect(policy.authorize({
      settings: { enabled: true, autonomyLevel, limits: {} },
      operation,
    }).allowed).toBe(allowed);
  });

  test('EXECUTE_LOW_RISK cannot execute medium risk or approval actions', () => {
    const settings = {
      enabled: true,
      autonomyLevel: 'EXECUTE_LOW_RISK',
      limits: {},
    };
    expect(policy.authorize({
      settings,
      operation: 'execute',
      riskDecision: { decision: 'allow', risk_level: 'low' },
    }).allowed).toBe(true);
    expect(policy.authorize({
      settings,
      operation: 'execute',
      riskDecision: { decision: 'require_approval', risk_level: 'medium' },
    })).toEqual({ allowed: false, reason: 'low_risk_only' });
  });

  test('FULL_WITH_LIMITS still requires approval and enforces every configured cap', () => {
    const settings = {
      enabled: true,
      autonomyLevel: 'FULL_WITH_LIMITS',
      limits: { maxAmountPerAction: 500000, maxDailyActions: 10 },
    };
    const riskDecision = { decision: 'require_approval', risk_level: 'high' };
    expect(policy.authorize({
      settings,
      operation: 'execute',
      riskDecision,
    })).toEqual({ allowed: false, reason: 'approval_required' });
    expect(policy.authorize({
      settings,
      operation: 'execute',
      riskDecision,
      approval: { status: 'consumed' },
      usage: { amount: 600000, dailyActions: 1 },
    })).toEqual({ allowed: false, reason: 'amount_limit_exceeded' });
  });

  test('a disabled agent cannot perform even read operations', () => {
    expect(policy.authorize({
      settings: { enabled: false, autonomyLevel: 'FULL_WITH_LIMITS' },
      operation: 'observe',
    })).toEqual({ allowed: false, reason: 'agent_disabled' });
  });
});
