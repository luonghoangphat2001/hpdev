'use strict';

const DeadLetterUiService = require('../../../src/services/workflow/state/dead-letter-ui.service');

describe('T132: Retry/Dead-Letter/Reconciliation UI Service', () => {
  test('lists dead letters and triggers dry run replay', async () => {
    const mockRepo = { listDeadLetters: jest.fn().mockResolvedValue([{ id: 'dl_999' }]) };
    const service = new DeadLetterUiService({ deadLetterRepository: mockRepo });

    const list = await service.getDeadLetters();
    expect(list.length).toBe(1);

    const dryRun = await service.triggerDryRunReplay('dl_999');
    expect(dryRun.dryRunSuccess).toBe(true);
    expect(dryRun.simulatedOutcome).toBe('WORKFLOW_COMPLETED');
  });
});
