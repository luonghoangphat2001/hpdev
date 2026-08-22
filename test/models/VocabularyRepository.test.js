'use strict';

const VocabularyRepository = require('../../src/models/VocabularyRepository');

describe('VocabularyRepository', () => {
  let db;
  let repo;

  beforeEach(() => {
    db = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };
    repo = new VocabularyRepository(db);
  });

  test('upsertWordByTopicAndWord inserts a new row when no match exists', async () => {
    db.query.mockResolvedValueOnce([]);
    db.queryOne.mockResolvedValueOnce({ id: 13, topic_no: 1 });
    db.query.mockResolvedValueOnce({ insertId: 99 });

    const result = await repo.upsertWordByTopicAndWord({
      topicNo: 1,
      word: 'read',
      meaning: 'đọc',
      example: 'New example',
    });

    expect(result).toEqual({ action: 'created', ids: [99] });
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('LOWER(TRIM(i.title)) = LOWER(TRIM(?))'),
      [1, 'read']
    );
    expect(db.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('FROM learning'),
      [1]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO learning_item'),
      [13, 'read', 'read', 'đọc', '', 'New example', '', 1]
    );
  });

  test('upsertWordByTopicAndWord updates every matching duplicate row', async () => {
    db.query.mockResolvedValueOnce([
      { id: 11, topic_id: 1, word: 'read' },
      { id: 42, topic_id: 1, word: 'read' },
    ]);
    db.queryOne.mockResolvedValue({ id: 13, topic_no: 1 });
    db.query.mockResolvedValue({ affectedRows: 1 });

    const result = await repo.upsertWordByTopicAndWord({
      topicNo: 1,
      word: 'read',
      meaning: 'đọc',
      pronunciation: '',
      example: 'The word "read" is useful when talking about books.',
      note: '',
    });

    expect(result).toEqual({ action: 'updated', ids: [11, 42] });
    expect(db.queryOne).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM learning'), [1]);
    expect(db.queryOne).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM learning'), [1]);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE learning_item SET'),
      [13, 'read', 'đọc', '', 'The word "read" is useful when talking about books.', '', 11]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE learning_item SET'),
      [13, 'read', 'đọc', '', 'The word "read" is useful when talking about books.', '', 42]
    );
  });
});
