'use strict';

const assert = require('assert');
const {
  banks: interviewBanks,
  buildSeedItems,
} = require('../../scripts/seed-tech-learning');
const {
  LEVEL,
  SEED_OWNER,
  banks,
  buildFundamentalItems,
  seedTechFundamentals,
} = require('../../scripts/seed-tech-fundamentals');

describe('seed-tech-fundamentals', () => {
  it('builds exactly 100 unique beginner theory questions per stack', () => {
    const allTitles = [];

    for (const [slug, bank] of Object.entries(banks)) {
      const items = buildFundamentalItems(slug, bank);

      assert.strictEqual(bank.concepts.length, 20, slug);
      assert.strictEqual(items.length, 100, slug);
      assert.strictEqual(new Set(items.map((item) => item.title)).size, 100, slug);
      assert.ok(items.every((item) => item.level === LEVEL), slug);
      assert.ok(items.every((item) => item.tags.includes(`${slug},`)), slug);
      assert.ok(items.every((item) => item.tags.includes('intern')), slug);
      assert.ok(items.every((item) => item.tags.includes('fresher')), slug);
      assert.ok(items.every((item) => item.tags.includes('fundamentals')), slug);
      assert.ok(items.every((item) => item.tags.includes('theory')), slug);
      assert.ok(items.every((item) => item.content.quick_answer), slug);
      assert.ok(items.every((item) => item.content.detailed_answer), slug);
      assert.ok(items.every((item) => item.content.code_example), slug);
      assert.ok(items.every((item) => item.sampleSolution.key_takeaways), slug);
      allTitles.push(...items.map((item) => item.title));
    }

    assert.strictEqual(allTitles.length, 600);
    assert.strictEqual(new Set(allTitles).size, 600);
  });

  it('does not duplicate a title from the existing interview seed bank', () => {
    for (const [slug, bank] of Object.entries(banks)) {
      const existingTitles = new Set(buildSeedItems(slug, interviewBanks[slug]).map((item) => item.title));
      const collisions = buildFundamentalItems(slug, bank)
        .map((item) => item.title)
        .filter((title) => existingTitles.has(title));

      assert.deepStrictEqual(collisions, [], slug);
    }
  });

  it('inserts 600 rows in six bulk statements inside one transaction', async () => {
    let stackIndex = 0;
    let insertCount = 0;
    const db = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn(async (sql) => {
        if (sql.startsWith('SELECT id FROM learning')) {
          stackIndex += 1;
          return [[{ id: stackIndex }]];
        }
        if (sql.includes('FROM learning_item')) return [[]];
        if (sql.startsWith('INSERT INTO learning_item')) {
          insertCount += 1;
          return [{ affectedRows: 100 }];
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
    };

    const result = await seedTechFundamentals(db);

    assert.deepStrictEqual(result, { ok: true, created: 600, skipped: 0, total: 600 });
    assert.strictEqual(insertCount, 6);
    expect(db.beginTransaction).toHaveBeenCalledTimes(1);
    expect(db.commit).toHaveBeenCalledTimes(1);
    expect(db.rollback).not.toHaveBeenCalled();
  });

  it('is idempotent and performs no writes when all seed titles exist', async () => {
    let stackIndex = 0;
    let writes = 0;
    const db = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn(async (sql) => {
        if (sql.startsWith('SELECT id FROM learning')) {
          stackIndex += 1;
          return [[{ id: stackIndex }]];
        }
        if (sql.includes('FROM learning_item')) {
          const [slug, bank] = Object.entries(banks)[stackIndex - 1];
          return [buildFundamentalItems(slug, bank).map(({ title }) => ({ title }))];
        }
        writes += 1;
        return [{ affectedRows: 0 }];
      }),
    };

    const result = await seedTechFundamentals(db);

    assert.deepStrictEqual(result, { ok: true, created: 0, skipped: 600, total: 600 });
    assert.strictEqual(writes, 0);
    expect(db.commit).toHaveBeenCalledTimes(1);
  });

  it('rolls back when a required learning stack is missing', async () => {
    const db = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue([[]]),
    };

    await expect(seedTechFundamentals(db)).rejects.toThrow('Learning stack not found: php');
    expect(db.commit).not.toHaveBeenCalled();
    expect(db.rollback).toHaveBeenCalledTimes(1);
  });
});
