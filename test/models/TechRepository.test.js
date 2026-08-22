'use strict';

const TechRepository = require('../../src/models/TechRepository');

describe('TechRepository', () => {
  let db;
  let repo;

  beforeEach(() => {
    db = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };
    repo = new TechRepository(db);
  });

  test('findStacks queries active stacks with user progress when userId provided', async () => {
    db.query.mockResolvedValueOnce([
      { id: 1, slug: 'php', name: 'PHP', total_questions: 10, mastered_count: 3 },
      { id: 2, slug: 'nextjs', name: 'Next.js', total_questions: 8, mastered_count: 2 },
    ]);

    const result = await repo.findStacks(42);
    expect(result).toHaveLength(2);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE s.is_active = 1'),
      [42]
    );
  });

  test('findStackBySlug returns stack matching slug', async () => {
    db.queryOne.mockResolvedValueOnce({ id: 1, slug: 'php', name: 'PHP' });

    const result = await repo.findStackBySlug('PHP ');
    expect(result).toEqual({ id: 1, slug: 'php', name: 'PHP' });
    expect(db.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM tech_stacks WHERE slug = ? LIMIT 1',
      ['php']
    );
  });

  test('createQuestion inserts question with correct parameters', async () => {
    db.query.mockResolvedValueOnce({ insertId: 77 });

    const id = await repo.createQuestion({
      stackId: 1,
      topicId: 2,
      title: 'Closure in JS',
      question: 'What is a closure?',
      quickAnswer: 'Function with lexical scope',
      detailedAnswer: 'Detailed explanation of closures',
      codeExample: 'function outer() { ... }',
      interviewTips: 'Watch out for memory leaks',
      practicalTips: 'Use for encapsulation',
      level: 'mid',
      tags: 'JS, Closures',
      createdBy: 'admin',
      sortOrder: 1,
    });

    expect(id).toBe(77);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tech_questions'),
      [1, 2, 'Closure in JS', 'What is a closure?', 'Function with lexical scope', 'Detailed explanation of closures', 'function outer() { ... }', 'Watch out for memory leaks', 'Use for encapsulation', 'mid', 'JS, Closures', 'admin', 1]
    );
  });

  test('upsertUserProgress inserts new row when none exists', async () => {
    db.queryOne.mockResolvedValueOnce(null);
    db.query.mockResolvedValueOnce({ insertId: 1 });

    const ok = await repo.upsertUserProgress(10, 5, {
      status: 'mastered',
      isBookmarked: true,
      personalNotes: 'Mastered on 2026-08-14',
    });

    expect(ok).toBe(true);
    expect(db.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, status, is_bookmarked, personal_notes FROM tech_user_progress'),
      [10, 5]
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tech_user_progress'),
      [10, 5, 'mastered', 1, 'Mastered on 2026-08-14', expect.any(String)]
    );
  });

  test('upsertUserProgress updates existing progress row', async () => {
    db.queryOne.mockResolvedValueOnce({ id: 99, status: 'learning' });
    db.query.mockResolvedValueOnce({ affectedRows: 1 });

    const ok = await repo.upsertUserProgress(10, 5, {
      status: 'mastered',
    });

    expect(ok).toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tech_user_progress SET'),
      [expect.any(String), 'mastered', 10, 5]
    );
  });
});
