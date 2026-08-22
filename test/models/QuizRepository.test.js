'use strict';

const QuizRepository = require('../../src/models/QuizRepository');

describe('QuizRepository adaptive history', () => {
  it('aggregates only the requested user and item ids', async () => {
    const db = { query: jest.fn().mockResolvedValue([]) };
    const repo = new QuizRepository(db);

    await repo.getItemPerformance('user-7', [4, 5, 4]);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY item_id'),
      ['user-7', 4, 5]
    );
  });

  it('does not query when no valid item id is supplied', async () => {
    const db = { query: jest.fn() };
    const repo = new QuizRepository(db);
    await expect(repo.getItemPerformance('user-7', [])).resolves.toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });
});
