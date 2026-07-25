'use strict';

const ManualConsoleApiService = require('../../../src/application/services/workflow/manual-console-api.service');

describe('T097: Manual Mode and Pending Action Console API', () => {
  test('lists and resolves pending actions', async () => {
    const mockRepo = { listDeadLetters: jest.fn().mockResolvedValue([{ id: 'dl_1' }]) };
    const service = new ManualConsoleApiService({ deadLetterRepository: mockRepo });

    const list = await service.listPendingActions();
    expect(list.length).toBe(1);

    const res = await service.resolvePendingAction('dl_1', 'RETRY');
    expect(res.status).toBe('RESOLVED');
  });
});
