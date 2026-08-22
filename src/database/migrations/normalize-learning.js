'use strict';

/**
 * Move misclassified English learning items into the correct modules.
 * @param {import('../../models/Database')} db
 */
module.exports = async function run(db) {
    // 3c. Auto-migration: Move all reading, writing, speaking, ielts items to their designated modules
    // Relink items to their designated modules strictly by their explicit type
    await db.query(`
      UPDATE learning_item i
      JOIN learning l ON l.slug = 'english-reading'
      SET i.learning_id = l.id
      WHERE i.type = 'reading' AND i.learning_id != l.id
    `).catch(() => {});

    await db.query(`
      UPDATE learning_item i
      JOIN learning l ON l.slug = 'english-writing'
      SET i.learning_id = l.id
      WHERE i.type = 'writing' AND i.learning_id != l.id
    `).catch(() => {});

    await db.query(`
      UPDATE learning_item i
      JOIN learning l ON l.slug = 'english-speaking'
      SET i.learning_id = l.id
      WHERE i.type = 'speaking' AND i.learning_id != l.id
    `).catch(() => {});

    await db.query(`
      UPDATE learning_item i
      JOIN learning l ON l.slug = 'english-ielts'
      SET i.learning_id = l.id
      WHERE i.type = 'ielts' AND i.learning_id != l.id
    `).catch(() => {});

    // Migrate any legacy english-rw items
    await db.query(`
      UPDATE learning_item i
      JOIN learning l ON l.slug = 'english-reading'
      SET i.type = 'reading', i.learning_id = l.id
      WHERE i.learning_id IN (SELECT id FROM (SELECT id FROM learning WHERE slug = 'english-rw') tmp)
    `).catch(() => {});
};

