'use strict';

const DashboardController = require('../../src/controllers/DashboardController');

describe('T144 supplemental: dashboard agent lifecycle controller', () => {
  test('passes CEO lifecycle command to the persistent service', async () => {
    const lifecycleService = {
      transition: jest.fn().mockResolvedValue({
        agentId: 'dan_ops',
        lifecycleState: 'PAUSED',
        stateVersion: 4,
      }),
    };
    const controller = new DashboardController({}, lifecycleService);
    const req = {
      params: { agentId: 'dan_ops' },
      body: {
        toState: 'PAUSED',
        expectedVersion: 3,
        actorId: 'ceo-dashboard',
        reason: 'Investigate incorrect action',
      },
    };
    const res = { json: jest.fn((value) => value) };

    await controller.controlAgent(req, res);

    expect(lifecycleService.transition).toHaveBeenCalledWith({
      agentId: 'dan_ops',
      toState: 'PAUSED',
      expectedVersion: 3,
      actorId: 'ceo-dashboard',
      reason: 'Investigate incorrect action',
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });
});
