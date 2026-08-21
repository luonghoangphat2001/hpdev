'use strict';

const RecoveryRehearsalService = require('../../../src/services/release/rollback/recovery-rehearsal.service');

describe('T098: Backup, Restore and Disaster-Recovery Rehearsal', () => {
  test('executes backup and restore rehearsal', async () => {
    const service = new RecoveryRehearsalService();
    const res = await service.rehearseBackupAndRestore();

    expect(res.backupValid).toBe(true);
    expect(res.restoreValid).toBe(true);
    expect(res.rtoAchievedSeconds).toBeLessThan(60);
  });
});
