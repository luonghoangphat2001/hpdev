'use strict';

const RollbackRehearsalService = require('../../../src/services/release/rollback/rollback-rehearsal.service');

describe('T118: Migration/Rollback/DR Rehearsal Service', () => {
  test('executes staging migration, rollback, and replay rehearsal', async () => {
    const service = new RollbackRehearsalService();
    const res = await service.executeRehearsalOnStaging();

    expect(res.migrationPassed).toBe(true);
    expect(res.rollbackPassed).toBe(true);
    expect(res.eventReplayPassed).toBe(true);
  });
});
