'use strict';

require('dotenv').config();

const mysqlPoolFactory = require('../src/infrastructure/database/mysql-pool');
const MigrationRunner = require('../src/infrastructure/database/migration-runner');

async function main() {
  const pool = mysqlPoolFactory.create();
  try {
    const result = await new MigrationRunner({ pool }).run();
    console.log(
      result.executed.length > 0
        ? `Applied migrations: ${result.executed.join(', ')}`
        : 'Database schema is up to date'
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error.message}`);
  process.exitCode = 1;
});
