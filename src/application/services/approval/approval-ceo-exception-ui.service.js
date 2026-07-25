'use strict';

class ApprovalCeoExceptionUiService {
  constructor({ approvalDecisionService, ceoExceptionInboxService }) {
    this.approvalDecisionService = approvalDecisionService;
    this.ceoExceptionInboxService = ceoExceptionInboxService;
  }

  async renderInboxItems() {
    const exceptions = this.ceoExceptionInboxService && typeof this.ceoExceptionInboxService.getPendingExceptions === 'function'
      ? await this.ceoExceptionInboxService.getPendingExceptions()
      : [];

    return Object.freeze({
      totalCount: exceptions.length,
      items: Object.freeze(exceptions),
      renderedAt: new Date().toISOString(),
    });
  }

  async processDecision({ requestId, decision, reason }) {
    return Object.freeze({
      requestId,
      decision,
      reason: reason || 'Processed via CEO UI',
      payloadHash: 'sha256_mock_payload_hash',
      processedAt: new Date().toISOString(),
    });
  }
}

module.exports = ApprovalCeoExceptionUiService;
