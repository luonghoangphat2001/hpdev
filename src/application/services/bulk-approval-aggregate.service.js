'use strict';

class BulkApprovalAggregateService {
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

module.exports = BulkApprovalAggregateService;
