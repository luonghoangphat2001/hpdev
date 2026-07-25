'use strict';

const DeterministicBusinessInvariantSuite = require('../../src/domain/services/deterministic-business-invariant.suite');

describe('T083: Deterministic Business Invariant Suite', () => {
  test('verifies refund amount positive invariant', () => {
    const suite = new DeterministicBusinessInvariantSuite();
    expect(suite.verifyInvariants({ actionType: 'cfo.refund.issue', payload: { amount: 10000 } }).passed).toBe(true);
    expect(suite.verifyInvariants({ actionType: 'cfo.refund.issue', payload: { amount: -5 } }).passed).toBe(false);
  });

  test('verifies voucher cap invariant', () => {
    const suite = new DeterministicBusinessInvariantSuite();
    expect(suite.verifyInvariants({ actionType: 'cskh.voucher.create', payload: { voucherValue: 20000 } }).passed).toBe(true);
    expect(suite.verifyInvariants({ actionType: 'cskh.voucher.create', payload: { voucherValue: 600000 } }).passed).toBe(false);
  });
});
