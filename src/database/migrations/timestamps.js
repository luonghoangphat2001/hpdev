'use strict';

/**
 * Migration to ensure all database tables have audit timestamps & soft delete columns:
 * - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
 * - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * - deleted_at: DATETIME NULL (for soft deletion support)
 *
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, addIndexIfMissing: Function }} helpers
 */
module.exports = async function initializeTimestamps(db, helpers) {
  const tables = [
    'users',
    'config',
    'conversations',
    'schedules',
    'insights',
    'ai_memories',
    'agent_tasks',
    'discord_notification_outbox',
    'learning_category',
    'learning',
    'learning_item',
    'learning_meta_data',
    'learning_delivery_log',
    'learning_quiz_result',
    'user_quiz_stats',
    'tech_stacks',
    'tech_topics',
    'tech_questions',
    'tech_user_progress',
  ];

  for (const table of tables) {
    try {
      await helpers.addColumnIfMissing(table, 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      await helpers.addColumnIfMissing(table, 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      await helpers.addColumnIfMissing(table, 'deleted_at', 'DATETIME NULL');
    } catch (err) {
      console.warn(`[TimestampsMigration] Warning on table ${table}:`, err.message);
    }
  }
};
