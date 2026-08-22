'use strict';

const { unpackItems } = require('../../services/learning/ContentNormalizer');

/**
 * Unpack accidentally serialized learning-item wrappers.
 * @param {import('../../models/Database')} db
 */
module.exports = async function run(db) {
    try {
      const rows = await db.query(`
        SELECT id, learning_id, type, title, prompt, level, content 
        FROM learning_item 
        WHERE title = 'Generated Content' 
           OR content LIKE '%"title"%' 
           OR prompt LIKE '[{%'
      `);

      for (const row of rows) {
        const items = unpackItems([{
          title: row.title,
          prompt: row.prompt,
          content: row.content,
          level: row.level,
        }]);
        if (items.length > 1 || (items.length === 1 && items[0].title !== row.title)) {
          // Delete the corrupted wrapper item and insert normalized children.
          await db.query('DELETE FROM learning_item WHERE id = ?', [row.id]);
          for (const it of items) {
            await db.query(
              `INSERT INTO learning_item (learning_id, type, title, prompt, level, content, sample_solution, tags, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ai_unpacked')`,
              [row.learning_id, row.type, it.title, it.prompt, it.level,
                JSON.stringify(it.content), JSON.stringify(it.sample_solution), it.tags || '']
            );
          }
        }
      }
    } catch (err) {
      console.warn('[Database] Cleanup corrupted items note:', err.message);
    }
};

