'use strict';

const MysqlCeoRepository =
  require('@repositories/CeoRepository');

describe('MysqlCeoRepository', () => {
  test('normalizes goal counts for the CEO brief', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([[
        { status: 'active', count: '4' },
        { status: 'at_risk', count: '1' },
      ]]),
    };
    const repository = new MysqlCeoRepository(executor);
    await expect(repository.goalSnapshot()).resolves.toEqual({
      active: 4,
      at_risk: 1,
    });
  });
});
