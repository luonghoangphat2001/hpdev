'use strict';

const ApprovalCeoExceptionUiService = require('../../src/application/services/approval-ceo-exception-ui.service');

describe('T131: Approval and CEO Exception Inbox UI Service', () => {
  test('renders inbox items and processes approval decision with payload hash', async () => {
    const service = new ApprovalCeoExceptionUiService({});
    const inbox = await service.renderInboxItems();
    const result = await service.processDecision({ requestId: 'req_123', decision: 'APPROVED', reason: 'Marginal cost verified' });

    expect(inbox.totalCount).toBeDefined();
    expect(result.decision).toBe('APPROVED');
    expect(result.payloadHash).toBeDefined();
  });
});
