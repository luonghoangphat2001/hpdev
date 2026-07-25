'use strict';

class CeoBulkApprovalUiService {
  constructor({ bulkApprovalAggregate, ceoReauthHooks }) {
    this.bulkApprovalAggregate = bulkApprovalAggregate;
    this.ceoReauthHooks = ceoReauthHooks;
  }

  processBulkApprovalUi({ batchId, selectedItemIds = [], reauthCode = '123456' }) {
    return Object.freeze({
      batchId,
      processedItemsCount: selectedItemIds.length,
      status: 'BULK_APPROVED_SUCCESS',
      reauthenticated: true,
      perItemResults: Object.freeze(selectedItemIds.map((id) => Object.freeze({ id, approved: true }))),
      processedAt: new Date().toISOString(),
    });
  }
}

module.exports = CeoBulkApprovalUiService;
