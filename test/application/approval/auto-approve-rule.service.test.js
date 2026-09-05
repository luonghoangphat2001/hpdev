'use strict';

const AutoApproveRuleService = require('@services/approval/decisions/auto-approve-rule.service');

describe('T194: Versioned AutoApproveRule Model/Editor Service', () => {
  test('creates versioned auto-approve rule with threshold, cumulative cap, confidence, and owner', () => {
    const service = new AutoApproveRuleService();
    const rule = service.createRule({
      actionScope: 'PO_APPROVAL',
      amountCapUSD: 1000,
      minConfidence: 0.95,
      owner: 'CEO',
      version: 'v1.1',
    });

    expect(rule.ruleId).toBeDefined();
    expect(rule.actionScope).toBe('PO_APPROVAL');
    expect(rule.minConfidence).toBe(0.95);
    expect(rule.version).toBe('v1.1');
  });
});
