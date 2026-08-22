'use strict';

const createMigrationHelpers = require('./helpers');

const schemaMigrations = [
  require('./migrations/conversations'),
  require('./migrations/users'),
  require('./migrations/schedules'),
  require('./migrations/insights'),
  require('./migrations/agents'),
  require('./migrations/notifications'),
  require('./migrations/learning'),
  require('./migrations/tech'),
];

const seeders = [
  require('./seeders/learning'),
];

const dataMigrations = [
  require('./migrations/normalize-learning'),
  require('./migrations/import-legacy-tech'),
];

const cleanupTasks = [
  require('./cleanup/learning-items'),
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

