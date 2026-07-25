'use strict';

const CeoBulkApprovalUiService = require('../../../src/application/services/approval/ceo-bulk-approval-ui.service');

describe('T193: CEO Bulk Approval UI Service', () => {
  test('processes bulk approval UI action with filtering, re-authentication, and per-item results', () => {
    const service = new CeoBulkApprovalUiService({});
    const res = service.processBulkApprovalUi({ batchId: 'b_100', selectedItemIds: ['item_1', 'item_2'] });

    expect(res.status).toBe('BULK_APPROVED_SUCCESS');
    expect(res.reauthenticated).toBe(true);
    expect(res.perItemResults.length).toBe(2);
  });
});
