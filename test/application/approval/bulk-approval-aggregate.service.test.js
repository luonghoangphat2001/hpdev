'use strict';

const BulkApprovalAggregateService = require('../../../src/application/services/approval/bulk-approval-aggregate.service');

describe('T191: BulkApproval Aggregate/Schema/API Service', () => {
  test('creates BulkApproval batch request with item totals, actor, currency, and audit link', () => {
    const service = new BulkApprovalAggregateService();
    const req = service.createBulkApprovalRequest({
      items: [{ id: '1', amount: 100 }, { id: '2', amount: 250 }],
      actor: 'CEO',
      currency: 'USD',
    });

    expect(req.batchId).toBeDefined();
    expect(req.totalAmount).toBe(350);
    expect(req.totalItems).toBe(2);
    expect(req.auditLink).toContain(req.batchId);
  });
});
