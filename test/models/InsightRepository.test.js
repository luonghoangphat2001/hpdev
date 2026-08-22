'use strict';

const mockQuery = jest.fn();
jest.mock('../../src/models/Database', () => ({
  getInstance: jest.fn().mockResolvedValue({ query: mockQuery }),
}));

const InsightRepository = require('../../src/models/InsightRepository');

describe('InsightRepository', () => {
  let repo;

  beforeEach(() => {
    mockQuery.mockClear();
    repo = new InsightRepository({ query: mockQuery });
  });

  it('upsert() calls INSERT ... ON DUPLICATE KEY UPDATE', async () => {
    mockQuery.mockResolvedValue([{ affectedRows: 1 }]);
    await repo.upsert('u1', 'discord', 'ch1', 'interest', 'React Native', 'https://x.com');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ai_memories'),
      ['u1', 'discord', 'ch1', 'interest', 'React Native', 'https://x.com']
    );
  });

  it('findByUser() queries by user_id and platform', async () => {
    const rows = [{ mem_key: 'interest', mem_value: 'React Native', source: null, updated_at: '2026-03-25 10:00:00' }];
    mockQuery.mockResolvedValue(rows);
    const result = await repo.findByUser('u1', 'discord');
    expect(result).toEqual(rows);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE user_id = ? AND platform = ?'),
      ['u1', 'discord']
    );
  });
});
