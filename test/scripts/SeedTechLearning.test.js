'use strict';

const assert = require('assert');
const {
  SEED_OWNER,
  banks,
  levels,
  buildSeedItems,
  seedTechLearning,
} = require('../../scripts/seed-tech-learning');

describe('seed-tech-learning', () => {
  it('builds exactly 100 unique theory questions per stack with balanced levels', () => {
    for (const [slug, bank] of Object.entries(banks)) {
      const items = buildSeedItems(slug, bank);

      assert.strictEqual(items.length, 100, slug);
      assert.strictEqual(new Set(items.map((item) => item.title)).size, 100, slug);
      assert.deepStrictEqual(
        Object.fromEntries(levels.map((level) => [level, items.filter((item) => item.level === level).length])),
        { beginner: 25, junior: 25, intermediate: 25, advanced: 25 }
      );
      assert.ok(items.every((item) => item.content.quick_answer && item.content.detailed_answer));
      assert.ok(items.every((item) => item.content.code_example && item.sampleSolution.key_takeaways));
      assert.ok(items.every((item) => item.title.trim().split(/\s+/).length <= 12));
      assert.ok(items.every((item) => item.prompt.trim().split(/\s+/).length <= 35));
      assert.ok(items.every((item) => item.content.quick_answer.trim().split(/\s+/).length <= 30));
      assert.ok(items.every((item) => item.content.detailed_answer.trim().split(/\s+/).length <= 80));
      assert.ok(items.every((item) => item.content.interview_tips.trim().split(/\s+/).length <= 25));
      assert.ok(items.every((item) => item.content.practical_tips.trim().split(/\s+/).length <= 25));
    }
  });

  it('skips all current seed rows when rerun', async () => {
    let stackIndex = 0;
    let writes = 0;
    const db = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      execute: async (sql) => {
        if (sql.startsWith('SELECT id FROM learning')) {
          stackIndex += 1;
          return [[{ id: stackIndex }]];
        }
        if (sql.includes('FROM learning_item')) {
          const [slug, bank] = Object.entries(banks)[stackIndex - 1];
          return [buildSeedItems(slug, bank).map((item, index) => ({
            id: stackIndex * 1000 + index,
            title: item.title,
            created_by: SEED_OWNER,
          }))];
        }
        writes += 1;
        return [{ affectedRows: 0 }];
      },
    };

    const result = await seedTechLearning(db);

    assert.deepStrictEqual(result, { ok: true, created: 0, updated: 0, skipped: 600, total: 600 });
    assert.strictEqual(writes, 0);
  });
});
