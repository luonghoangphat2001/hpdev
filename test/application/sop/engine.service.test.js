'use strict';

const SopEngineService = require('@services/workflow/sop/sop-engine.service');

describe('T061: SOP Execution Engine', () => {
  test('executes SOP steps successfully', async () => {
    const sopRepository = {
      findVersionForUpdate: jest.fn().mockResolvedValue({
        version: 1,
        definition: {
          name: 'Order Refund SOP',
          steps: [
            {
              id: 'step_1',
              name: 'Verify Order',
              preconditions: ['orderId'],
              expectedOutput: { verified: true },
            },
            {
              id: 'step_2',
              name: 'Issue Refund',
              preconditions: ['verified'],
              expectedOutput: { refunded: true },
            },
          ],
        },
      }),
    };

    const engine = new SopEngineService({ sopRepository });
    const result = await engine.executeSop({
      sopId: 'sop-refund',
      version: 1,
      initialContext: { orderId: 'ord_123' },
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.steps.length).toBe(2);
    expect(result.finalContext.refunded).toBe(true);
  });

  test('stops execution when precondition fails', async () => {
    const sopRepository = {
      findVersionForUpdate: jest.fn().mockResolvedValue({
        version: 1,
        definition: {
          name: 'Order Refund SOP',
          steps: [
            {
              id: 'step_1',
              name: 'Verify Order',
              preconditions: ['missingField'],
              expectedOutput: { verified: true },
            },
          ],
        },
      }),
    };

    const engine = new SopEngineService({ sopRepository });
    const result = await engine.executeSop({
      sopId: 'sop-refund',
      version: 1,
      initialContext: {},
    });

    expect(result.status).toBe('INCOMPLETE');
    expect(result.steps[0].status).toBe('BLOCKED_PRECONDITION_FAILED');
  });
});
