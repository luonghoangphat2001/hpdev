'use strict';

class FinancialAnalysisService {
  reconcile(summary) {
    const expectedRevenue = Number(summary.expected_revenue ?? 0);
    const recordedRevenue = Number(summary.recorded_revenue ?? summary.revenue ?? 0);
    const variance = recordedRevenue - expectedRevenue;
    return Object.freeze({
      expected_revenue: expectedRevenue,
      recorded_revenue: recordedRevenue,
      variance,
      balanced: variance === 0,
    });
  }

  assertRefundEligible(order, amount) {
    const refundable = Number(
      order.refundable_amount
      ?? Math.max(Number(order.total ?? 0) - Number(order.refunded_amount ?? 0), 0),
    );
    if (!Number.isInteger(amount) || amount <= 0 || amount > refundable) {
      const error = new Error(`Refund amount exceeds refundable balance: ${refundable}`);
      error.code = 'refund_amount_invalid';
      throw error;
    }
    return refundable;
  }
}

module.exports = FinancialAnalysisService;
