'use strict';

const MysqlCeoBriefRepository =
  require('../../../src/infrastructure/database/repositories/mysql-ceo-brief.repository');

describe('MysqlCeoBriefRepository', () => {
  test('normalizes goal counts for the CEO brief', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([[
        { status: 'active', count: '4' },
        { status: 'at_risk', count: '1' },
      ]]),
    };
    const repository = new MysqlCeoBriefRepository(executor);
    await expect(repository.goalSnapshot()).resolves.toEqual({
      active: 4,
      at_risk: 1,
    });
  });
});
