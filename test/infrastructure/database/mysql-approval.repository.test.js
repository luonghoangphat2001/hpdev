'use strict';

const MysqlApprovalRepository = require('@repositories/ApprovalRepository');

describe('MysqlApprovalRepository', () => {
  test('locks approval rows before making a decision', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([[{ approval_id: 'apr_1' }]]),
    };
    const repo = new MysqlApprovalRepository(executor);

    await expect(repo.findByApprovalIdForUpdate('apr_1'))
      .resolves.toEqual({ approval_id: 'apr_1' });
    expect(executor.execute.mock.calls[0][0]).toContain('FOR UPDATE');
  });

  test('uses status, version, and expiry guards in the atomic update', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
    };
    const repo = new MysqlApprovalRepository(executor);

    await expect(repo.decidePending('apr_1', {
      status: 'consumed',
      expectedVersion: 3,
      actorId: 'ceo-123',
      reason: 'approved',
      decidedAt: new Date('2026-07-25T08:00:00Z'),
    })).resolves.toBe(true);

    const sql = executor.execute.mock.calls[0][0];
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain('decision_version = ?');
    expect(sql).toContain('expires_at > ?');
  });
});
