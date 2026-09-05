'use strict';

require('module-alias/register');
require("dotenv").config();

const mysqlPoolFactory = require("@database/mysql-pool");
const MigrationRunner = require("@database/migration-runner");

async function main() {
  const pool = mysqlPoolFactory.create();
  try {
    const result = await new MigrationRunner({ pool }).run();
    console.log(
      result.executed.length > 0
        ? `Applied migrations: ${result.executed.join(", ")}`
        : "Database schema is up to date"
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error.message}`);
  process.exitCode = 1;
});
