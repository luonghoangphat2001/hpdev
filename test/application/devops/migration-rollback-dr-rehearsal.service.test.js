'use strict';

const MigrationRollbackDrRehearsalService = require('../../../src/application/services/devops/migration-rollback-dr-rehearsal.service');

describe('T118: Migration/Rollback/DR Rehearsal Service', () => {
  test('executes staging migration, rollback, and replay rehearsal', async () => {
    const service = new MigrationRollbackDrRehearsalService();
    const res = await service.executeRehearsalOnStaging();

    expect(res.migrationPassed).toBe(true);
    expect(res.rollbackPassed).toBe(true);
    expect(res.eventReplayPassed).toBe(true);
  });
});
