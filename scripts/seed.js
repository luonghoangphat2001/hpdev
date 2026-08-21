'use strict';

require("dotenv").config();

const mysqlPoolFactory = require("../src/database/mysql-pool");
const SeedRunner = require("../src/database/seed-runner");

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
