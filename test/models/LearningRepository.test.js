'use strict';

const assert = require('assert');
const LearningRepository = require('../../src/models/LearningRepository');

describe('LearningRepository (4-Table Architecture)', () => {
  let repo;
  let mockDb;
  let queryLog;

  beforeEach(() => {
    queryLog = [];
    mockDb = {
      query: async (sql, params = []) => {
        queryLog.push({ sql, params });
        if (sql.includes('FROM learning_category')) {
          return [{ id: 1, slug: 'tech', name: 'Tech', icon: '💻' }, { id: 2, slug: 'english', name: 'English', icon: '🇬🇧' }];
        }
        if (sql.includes('FROM learning l')) {
          return [{ id: 10, category_id: 1, type: 'tech_question', slug: 'php', name: 'PHP', item_count: 5 }];
        }
        if (sql.includes('FROM learning_item i')) {
          return [{
            id: 101,
            learning_id: 10,
            type: 'tech_question',
            title: 'What is OPcache?',
            prompt: 'Explain OPcache in PHP 8',
            level: 'junior',
            content: JSON.stringify({ quick_answer: 'Precompiled bytecode cache' }),
            sample_solution: JSON.stringify({ key_takeaways: 'Zero parse overhead' }),
            is_sent: 0,
            is_active: 1,
            status: 'unstudied',
            is_bookmarked: 0,
          }];
        }
        if (sql.includes('INSERT INTO learning_item')) {
          return { insertId: 202, affectedRows: 1 };
        }
        if (sql.includes('UPDATE learning_item') || sql.includes('DELETE FROM learning_item') || sql.includes('INSERT INTO learning_meta_data')) {
          return { affectedRows: 1 };
        }
        return [];
      },
      queryOne: async (sql, params = []) => {
        queryLog.push({ sql, params });
        if (sql.includes('FROM learning_category')) {
          return { id: 1, slug: 'tech', name: 'Tech' };
        }
        if (sql.includes('FROM learning l')) {
          return { id: 10, category_id: 1, type: 'tech_question', slug: 'php', name: 'PHP' };
        }
        if (sql.includes('FROM learning_item i')) {
          return {
            id: 101,
            learning_id: 10,
            type: 'tech_question',
            title: 'What is OPcache?',
            content: '{"quick_answer":"Cache"}',
            sample_solution: '{}',
            ai_feedback: null,
          };
        }
        return null;
      },
    };
    repo = new LearningRepository(mockDb);
  });

  it('findCategories returns list of active categories', async () => {
    const cats = await repo.findCategories();
    assert.strictEqual(cats.length, 2);
    assert.strictEqual(cats[0].slug, 'tech');
  });

  it('findCategoryBySlug returns single category', async () => {
    const cat = await repo.findCategoryBySlug('tech');
    assert.ok(cat);
    assert.strictEqual(cat.slug, 'tech');
  });

  it('findLearnings filters by category and type', async () => {
    const list = await repo.findLearnings('tech', 'tech_question');
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].slug, 'php');
  });

  it('findItems returns parsed JSON content and solution', async () => {
    const items = await repo.findItems({ categorySlug: 'tech', learningSlug: 'php' });
    assert.strictEqual(items.length, 1);
    assert.strictEqual(typeof items[0].content, 'object');
    assert.strictEqual(items[0].content.quick_answer, 'Precompiled bytecode cache');
  });

  it('createItem serializes content and inserts into learning_item', async () => {
    const id = await repo.createItem({
      learningId: 10,
      type: 'tech_question',
      title: 'What is Fiber in React?',
      content: { quick_answer: 'Reconciliation engine' },
    });
    assert.strictEqual(id, 202);
    const insertLog = queryLog.find(q => q.sql.includes('INSERT INTO learning_item'));
    assert.ok(insertLog);
    assert.strictEqual(insertLog.params[0], 10);
    assert.strictEqual(insertLog.params[2], 'What is Fiber in React?');
  });

  it('findPracticeExamPool filters requested stacks and theory types', async () => {
    const items = await repo.findPracticeExamPool({
      categorySlug: 'tech',
      level: 'beginner',
      learningSlugs: ['php', 'nodejs'],
      types: ['tech_question'],
    });
    assert.strictEqual(items.length, 1);
    const query = queryLog.find((entry) => entry.sql.includes('LIMIT 5000'));
    assert.ok(query.sql.includes('l.slug IN (?, ?)'));
    assert.ok(query.sql.includes('i.type IN (?)'));
    assert.ok(query.sql.includes('i.level = ?'));
    assert.deepStrictEqual(query.params, ['tech', 'beginner', 'php', 'nodejs', 'tech_question']);
  });

  it('loads per-item correct and wrong counts for one user', async () => {
    await repo.getItemPerformance('user-7', [101, 102, 101]);
    const query = queryLog.find((entry) => entry.sql.includes('SUM(is_correct = 1)'));
    assert.ok(query);
    assert.deepStrictEqual(query.params, ['user-7', 101, 102]);
  });

  it('appends every valid item attempt in one insert', async () => {
    const recorded = await repo.recordItemAttempts('user-7', 'admin', 'practice_exam', [
      { item_id: 101, is_correct: false },
      { item_id: 102, is_correct: true },
    ]);
    const query = queryLog.find((entry) => entry.sql.includes('INSERT INTO learning_quiz_result'));
    assert.strictEqual(recorded, 2);
    assert.ok(query);
    assert.deepStrictEqual(query.params, [
      101, 'user-7', 'admin', 'practice_exam', 0,
      102, 'user-7', 'admin', 'practice_exam', 1,
    ]);
  });

  it('updateItem modifies fields dynamically', async () => {
    const ok = await repo.updateItem(101, { title: 'Updated Title', isSent: 1 });
    assert.strictEqual(ok, true);
    const updateLog = queryLog.find(q => q.sql.includes('UPDATE learning_item'));
    assert.ok(updateLog);
    assert.ok(updateLog.sql.includes('title = ?'));
    assert.ok(updateLog.sql.includes('is_sent = ?'));
  });

  it('deleteItem removes item', async () => {
    const ok = await repo.deleteItem(101);
    assert.strictEqual(ok, true);
  });

  it('upsertMetadata tracks user progress and bookmarks', async () => {
    const ok = await repo.upsertMetadata(101, 'admin', {
      status: 'mastered',
      isBookmarked: true,
      score: 9.5,
      aiFeedback: { summary: 'Excellent' },
    });
    assert.strictEqual(ok, true);
    const metaLog = queryLog.find(q => q.sql.includes('learning_meta_data'));
    assert.ok(metaLog);
  });

  it('insertQuizResult appends a new history row instead of upserting', async () => {
    const id = await repo.insertQuizResult(101, 'admin', {
      score: 8,
      userSubmission: JSON.stringify({ score: 4, total: 5 }),
      aiFeedback: { mode: 'multiple_choice' },
    });

    const metaLog = queryLog.find(q => q.sql.includes('INSERT INTO learning_meta_data'));
    assert.ok(metaLog);
    assert.ok(metaLog.sql.includes('INSERT INTO'));
    assert.match(metaLog.params[2], /^quiz_result_/);
    assert.strictEqual(id, undefined);
  });

  it('normalizes legacy Generated Content rows when reading items', async () => {
    mockDb.query = async (sql, params = []) => {
      queryLog.push({ sql, params });
      if (sql.includes('FROM learning_item i')) {
        return [{
          id: 101,
          title: 'Generated Content',
          prompt: '[{"title":"Question A","prompt":"Explain A","content":{"quick_answer":"Answer A"}}]',
          content: '{}',
          sample_solution: '{}',
        }];
      }
      return [];
    };

    const rows = await repo.findItems({ learningId: 10, type: 'tech_question' });
    assert.strictEqual(rows[0].title, 'Question A');
    assert.strictEqual(rows[0].prompt, 'Explain A');
    assert.strictEqual(rows[0].content.quick_answer, 'Answer A');
  });

  it('pickUnsentItems finds unsent items for Discord', async () => {
    const items = await repo.pickUnsentItems('vocabulary', 1, 5);
    assert.ok(Array.isArray(items));
  });

  it('markItemSent sets is_sent to 1', async () => {
    await repo.markItemSent(101);
    const sentLog = queryLog.find(q => q.sql.includes('is_sent = 1'));
    assert.ok(sentLog);
  });

  it('findLearnings computes progress and completion when username is passed', async () => {
    mockDb.query = async (sql) => {
      if (sql.includes('FROM learning l')) {
        return [{
          id: 10,
          category_id: 1,
          type: 'tech_question',
          slug: 'php',
          name: 'PHP',
          item_count: 5,
          active_item_count: 5,
          mastered_item_count: 5,
          studying_item_count: 0,
        }];
      }
      return [];
    };

    const learnings = await repo.findLearnings('tech', 'tech_question', 'testuser');
    assert.strictEqual(learnings.length, 1);
    assert.strictEqual(learnings[0].is_completed, true);
    assert.strictEqual(learnings[0].progress_percent, 100);
  });

  it('findLearningHistory and countLearningHistory return filtered history', async () => {
    mockDb.query = async (sql) => {
      if (sql.includes('FROM learning_quiz_result r')) {
        return [{
          id: 1,
          item_id: 101,
          user_id: 'user-7',
          username: 'testuser',
          quiz_type: 'vocabulary',
          is_correct: 1,
          score_delta: 10,
          item_title: 'Resilience',
          learning_name: 'Topic 1',
        }];
      }
      return [];
    };
    mockDb.queryOne = async (sql) => {
      if (sql.includes('COUNT(*) AS total')) {
        return { total: 1 };
      }
      return null;
    };

    const history = await repo.findLearningHistory({ userId: 'user-7', limit: 10 });
    const count = await repo.countLearningHistory({ userId: 'user-7' });

    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].is_correct, true);
    assert.strictEqual(count, 1);
  });

  it('getUserLearningSummary calculates complete statistics for an account', async () => {
    mockDb.queryOne = async (sql) => {
      if (sql.includes('COUNT(*) AS total_attempts')) {
        return { total_attempts: 10, correct_count: 8, wrong_count: 2, distinct_items_practiced: 10, last_attempt_at: '2026-08-23' };
      }
      if (sql.includes('status = \'mastered\'')) {
        return { mastered_count: 8, studying_count: 2, total_tracked_items: 10 };
      }
      if (sql.includes('completed_topics')) {
        return { completed_topics: 2 };
      }
      if (sql.includes('FROM user_quiz_stats')) {
        return { total_score: 80, correct_count: 8, wrong_count: 2, streak_days: 3, last_active_date: '2026-08-23' };
      }
      return null;
    };
    mockDb.query = async (sql) => {
      if (sql.includes('FROM learning_category c')) {
        return [{ category_id: 1, category_name: 'Tech', total_items: 20, mastered_items: 10, studying_items: 5 }];
      }
      return [];
    };

    const summary = await repo.getUserLearningSummary('user-7', 'testuser');
    assert.strictEqual(summary.total_attempts, 10);
    assert.strictEqual(summary.correct_count, 8);
    assert.strictEqual(summary.accuracy_rate, 80);
    assert.strictEqual(summary.mastered_count, 8);
    assert.strictEqual(summary.completed_topics_count, 2);
    assert.strictEqual(summary.streak_days, 3);
    assert.strictEqual(summary.categories[0].progress_percent, 50);
  });
});
