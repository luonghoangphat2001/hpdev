'use strict';

const SafeControlActionsUiService = require('../../src/application/services/safe-control-actions-ui.service');

describe('T137: Safe Control Actions UI Service', () => {
  test('executes guarded control actions like PAUSE or EMERGENCY_STOP', async () => {
    const service = new SafeControlActionsUiService({});
    const res = await service.executeSafeAction({ actionType: 'PAUSE', targetAgent: 'dan_cfo', reason: 'Maintenance' });

    expect(res.status).toBe('SUCCESS');
    expect(res.actionType).toBe('PAUSE');
    expect(res.targetAgent).toBe('dan_cfo');
  });

  test('throws error for invalid control action', async () => {
    const service = new SafeControlActionsUiService({});
    await expect(service.executeSafeAction({ actionType: 'DESTROY' })).rejects.toThrow('Invalid control action');
  });
});
