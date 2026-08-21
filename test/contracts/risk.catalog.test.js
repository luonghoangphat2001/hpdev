'use strict';

const actionCatalog = require('../../src/schemas/workflow/action.catalog');
const riskPolicyCatalog = require('../../src/schemas/policy/risk.catalog');
const {
  RiskCatalog,
  APPROVAL_MODES,
  DEFAULT_DENY_POLICY,
  DEFAULT_THRESHOLDS,
} = require('../../src/schemas/policy/risk.catalog');

describe('RiskCatalog', () => {
  it('covers every allowlisted Ecommerce action exactly once', () => {
    expect(riskPolicyCatalog.list().map(({ action }) => action).sort())
      .toEqual(actionCatalog.list().map(({ name }) => name).sort());
  });

  it('keeps read actions low risk without manual approval', () => {
    const readPolicies = actionCatalog.list()
      .filter(({ method }) => method === 'GET')
      .map(({ name }) => riskPolicyCatalog.get(name));

    readPolicies.forEach((entry) => {
      expect(entry.baseRisk).toBe('low');
      expect(entry.approval).toBe(APPROVAL_MODES.NEVER);
    });
  });

  it('always requires approval for a real refund', () => {
    expect(riskPolicyCatalog.get('finance.refund.execute')).toMatchObject({
      baseRisk: 'critical',
      approval: APPROVAL_MODES.ALWAYS,
    });
  });

  it('uses configurable threshold keys for conditional policies', () => {
    const voucher = riskPolicyCatalog.get('cskh.voucher.issue');

    expect(voucher.conditions.map(({ thresholdKey }) => thresholdKey))
      .toEqual(['voucherAmount', 'voucherConfidence']);
    expect(DEFAULT_THRESHOLDS).toMatchObject({
      voucherAmount: expect.any(Number),
      voucherConfidence: expect.any(Number),
    });
  });

  it('defaults unknown actions to deny and mandatory approval', () => {
    expect(riskPolicyCatalog.get('database.raw.execute')).toBe(DEFAULT_DENY_POLICY);
    expect(DEFAULT_DENY_POLICY).toMatchObject({
      decision: 'deny',
      reason: 'unknown_action',
      approval: APPROVAL_MODES.ALWAYS,
    });
  });

  it('fails startup when an allowlisted action lacks a policy', () => {
    expect(() => new RiskCatalog([], actionCatalog.list()))
      .toThrow('Missing risk policies');
  });
});
