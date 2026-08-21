/**
 * @fileoverview exception-ui.service - Provides exception-ui functionality.
 */
'use strict';

/**
 * ExceptionUiService
 * Manages exception ui logic.
 */
class ExceptionUiService {
  /**
   * constructor - Executes constructor.
   * @param {*} approvalDecisionService - Input parameter.
   * @param {*} ceoExceptionInboxService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ approvalDecisionService, ceoExceptionInboxService }) {
    this.approvalDecisionService = approvalDecisionService;
    this.ceoExceptionInboxService = ceoExceptionInboxService;
  }

  /**
   * renderInboxItems - Asynchronously executes render inbox items.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * processDecision - Asynchronously executes process decision.
   * @param {*} requestId - Input parameter.
   * @param {*} decision - Input parameter.
   * @param {*} reason - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

module.exports = ExceptionUiService;
