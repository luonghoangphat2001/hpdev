/**
 * @fileoverview approval-aggregate.service - Provides approval-aggregate functionality.
 */
'use strict';

/**
 * ApprovalAggregateService
 * Manages approval aggregate logic.
 */
class ApprovalAggregateService {
  /**
   * createBulkApprovalRequest - Executes create bulk approval request.
   * @param {*} items - Input parameter.
   * @param {*} actor - Input parameter.
   * @param {*} currency - Input parameter.
   * @returns {*} Result of operation.
   */
  createBulkApprovalRequest({ items = [], actor = 'CEO', currency = 'USD' }) {
    const batchId = `batch_${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    return Object.freeze({
      batchId,
      actor,
      currency,
      totalAmount,
      totalItems: items.length,
      items: Object.freeze(items.map((i) => Object.freeze({ ...i, status: 'PENDING' }))),
      expiry: new Date(Date.now() + 3600000).toISOString(),
      auditLink: `/audit/bulk/${batchId}`,
      createdAt: new Date().toISOString(),
    });
  }
}

module.exports = ApprovalAggregateService;
