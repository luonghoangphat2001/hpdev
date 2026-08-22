'use strict';

/**
 * Import legacy tech questions and progress into the learning hub.
 * @param {import('../../models/Database')} db
 */
module.exports = async function run(db) {
    try {
      // Import questions from tech_questions into learning_item
      await db.query(`
        INSERT INTO learning_item (learning_id, type, title, prompt, level, content, sample_solution, is_active, created_by)
        SELECT 
          l.id,
          'tech_question',
          tq.title,
          tq.question,
          tq.level,
          JSON_OBJECT(
            'quick_answer', tq.quick_answer,
            'detailed_answer', tq.detailed_answer,
            'code_example', IFNULL(tq.code_example, ''),
            'interview_tips', IFNULL(tq.interview_tips, ''),
            'practical_tips', IFNULL(tq.practical_tips, '')
          ),
          JSON_OBJECT(
            'quick_answer', tq.quick_answer,
            'detailed_answer', tq.detailed_answer
          ),
          tq.is_active,
          'legacy_import'
        FROM tech_questions tq
        JOIN tech_stacks ts ON ts.id = tq.stack_id
        JOIN learning l ON l.category_id = 1 AND l.slug = ts.slug
        WHERE NOT EXISTS (
          SELECT 1 FROM learning_item li 
          WHERE li.learning_id = l.id AND li.title = tq.title
        )
      `);

      // 4. Import user progress from tech_user_progress into learning_meta_data
      await db.query(`
        INSERT INTO learning_meta_data (item_id, username, meta_key, status, is_bookmarked, last_activity_at)
        SELECT 
          li.id,
          tup.username,
          'progress',
          tup.status,
          tup.is_bookmarked,
          tup.last_studied_at
        FROM tech_user_progress tup
        JOIN tech_questions tq ON tq.id = tup.question_id
        JOIN tech_stacks ts ON ts.id = tq.stack_id
        JOIN learning l ON l.category_id = 1 AND l.slug = ts.slug
        JOIN learning_item li ON li.learning_id = l.id AND li.title = tq.title
        WHERE NOT EXISTS (
          SELECT 1 FROM learning_meta_data lmd 
          WHERE lmd.item_id = li.id AND lmd.username = tup.username AND lmd.meta_key = 'progress'
        )
      `);
    } catch (err) {
      console.warn('[Database] Legacy migration note:', err.message);
    }
};

