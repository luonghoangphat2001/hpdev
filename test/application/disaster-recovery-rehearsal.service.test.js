'use strict';

const DisasterRecoveryRehearsalService = require('../../src/application/services/disaster-recovery-rehearsal.service');

describe('T098: Backup, Restore and Disaster-Recovery Rehearsal', () => {
  test('executes backup and restore rehearsal', async () => {
    const service = new DisasterRecoveryRehearsalService();
    const res = await service.rehearseBackupAndRestore();

    expect(res.backupValid).toBe(true);
    expect(res.restoreValid).toBe(true);
    expect(res.rtoAchievedSeconds).toBeLessThan(60);
  });
});
