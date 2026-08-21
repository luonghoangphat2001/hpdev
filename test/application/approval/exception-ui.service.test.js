'use strict';

const ExceptionUiService = require('../../../src/services/approval/decisions/exception-ui.service');

describe('T131: Approval and CEO Exception Inbox UI Service', () => {
  test('renders inbox items and processes approval decision with payload hash', async () => {
    const service = new ExceptionUiService({});
    const inbox = await service.renderInboxItems();
    const result = await service.processDecision({ requestId: 'req_123', decision: 'APPROVED', reason: 'Marginal cost verified' });

    expect(inbox.totalCount).toBeDefined();
    expect(result.decision).toBe('APPROVED');
    expect(result.payloadHash).toBeDefined();
  });
});
