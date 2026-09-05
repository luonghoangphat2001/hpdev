'use strict';

const RiskEvaluator = require('@policy/permissions/risk-evaluator');

describe('RiskEvaluator', () => {
  const evaluator = new RiskEvaluator();

  it('allows low-risk reads only when permission is granted', () => {
    expect(evaluator.evaluate({
      actionName: 'order.read',
      grantedPermissions: ['order.read'],
    })).toMatchObject({
      decision: 'allow',
      risk_level: 'low',
      permission: 'order.read',
    });
    expect(evaluator.evaluate({
      actionName: 'order.read',
      grantedPermissions: [],
    })).toMatchObject({
      decision: 'deny',
      reason: 'permission_not_granted',
      risk_level: 'critical',
    });
  });

  it('always requires approval for real refund execution', () => {
    expect(evaluator.evaluate({
      actionName: 'finance.refund.execute',
      payload: {},
      grantedPermissions: ['refund.execute'],
    })).toMatchObject({
      decision: 'require_approval',
      risk_level: 'critical',
    });
  });

  it('escalates amount thresholds deterministically', () => {
    expect(evaluator.evaluate({
      actionName: 'inventory.purchase_order_draft.create',
      payload: { total_amount: 499999 },
      grantedPermissions: ['purchase_order_draft.create'],
    })).toMatchObject({
      decision: 'allow',
      risk_level: 'medium',
    });
    expect(evaluator.evaluate({
      actionName: 'inventory.purchase_order_draft.create',
      payload: { total_amount: 500000 },
      grantedPermissions: ['purchase_order_draft.create'],
    })).toMatchObject({
      decision: 'require_approval',
      risk_level: 'high',
      matched_conditions: ['total_amount'],
    });
  });

  it('fails closed when fields required by policy are missing', () => {
    expect(evaluator.evaluate({
      actionName: 'cskh.voucher.issue',
      payload: { amount: 50000 },
      grantedPermissions: ['voucher.issue'],
    })).toMatchObject({
      decision: 'deny',
      reason: 'missing_policy_fields',
      missing_fields: ['confidence'],
    });
  });

  it('fails closed for malformed values used by risk conditions', () => {
    expect(evaluator.evaluate({
      actionName: 'inventory.purchase_order_draft.create',
      payload: { total_amount: 'not-a-number' },
      grantedPermissions: ['purchase_order_draft.create'],
    })).toMatchObject({
      decision: 'deny',
      reason: 'invalid_policy_fields',
      invalid_fields: ['total_amount'],
    });
  });

  it('cannot be convinced by payload to lower risk or bypass approval', () => {
    expect(evaluator.evaluate({
      actionName: 'finance.refund.execute',
      payload: {
        requested_risk: 'low',
        skip_approval: true,
      },
      grantedPermissions: ['refund.execute'],
    })).toMatchObject({
      decision: 'require_approval',
      risk_level: 'critical',
    });
  });

  it('denies actions outside the allowlist', () => {
    expect(evaluator.evaluate({
      actionName: 'database.raw.execute',
      grantedPermissions: ['*'],
    })).toMatchObject({
      decision: 'deny',
      reason: 'unknown_action',
    });
  });
});
