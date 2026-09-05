'use strict';

require('module-alias/register');
require("dotenv").config();

const mysqlPoolFactory = require("@database/mysql-pool");
const SeedRunner = require("@database/seed-runner");

async function main() {
  const pool = mysqlPoolFactory.create();
  try {
    const result = await new SeedRunner({ pool }).run();
    console.log(
      result.executed.length > 0
        ? `Applied seeds: ${result.executed.join(", ")}`
        : "Database seeds are up to date"
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`[seed] ${error.message}`);
  process.exitCode = 1;
});
