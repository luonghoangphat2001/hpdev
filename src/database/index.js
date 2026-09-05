'use strict';

const createMigrationHelpers = require('@database/helpers');

const schemaMigrations = [
  require('@database/migrations/config'),
  require('@database/migrations/conversations'),
  require('@database/migrations/users'),
  require('@database/migrations/schedules'),
  require('@database/migrations/insights'),
  require('@database/migrations/agents'),
  require('@database/migrations/notifications'),
  require('@database/migrations/learning'),
  require('@database/migrations/tech'),
  require('@database/migrations/timestamps'),
];

const seeders = [
  require('@database/seeders/learning'),
];

const dataMigrations = [
  require('@database/migrations/normalize-learning'),
  require('@database/migrations/import-legacy-tech'),
];

const cleanupTasks = [
  require('@database/cleanup/learning-items'),
];

module.exports = async function initializeDatabase(db) {
  const helpers = createMigrationHelpers(db);

  for (const migrate of schemaMigrations) {
    await migrate(db, helpers);
  }

  for (const seed of seeders) {
    await seed(db);
  }

  for (const migrate of dataMigrations) {
    await migrate(db);
  }

  for (const cleanup of cleanupTasks) {
    await cleanup(db);
  }
};
