/**
 * @fileoverview seed-runner - Automated idempotent database seeder runner.
 * @module database/seed-runner
 */
'use strict';

const defaultSeeds = require("./seeds");

/**
 * SeedRunner
 * Executes database seeders in an isolated, idempotent manner.
 */
class SeedRunner {
  /**
   * @param {Object} options
   * @param {Object} options.pool - MySQL connection pool.
   * @param {Array} [options.seedList] - List of seed definitions.
   * @param {string} [options.lockName] - Concurrency lock name.
   */
  constructor({
    pool,
    seedList = defaultSeeds,
    lockName = "openclaw_orchestrator_seeds",
  } = {}) {
    this.pool = pool;
    this.seeds = seedList;
    this.lockName = lockName;
    this.#validate();
  }

  /**
   * Executes all registered seed modules in order.
   * @returns {Promise<{ executed: string[] }>}
   */
  async run() {
    const connection = await this.pool.getConnection();
    let lockHeld = false;
    try {
      const [lockRows] = await connection.query(
        "SELECT GET_LOCK(?, 30) AS acquired",
        [this.lockName]
      );
      lockHeld = Number(lockRows[0]?.acquired) === 1;
      if (!lockHeld) throw new Error("Could not acquire seed execution lock");

      const executed = [];
      for (const seed of this.seeds) {
        await seed.run(connection);
        executed.push(seed.id);
      }

      return Object.freeze({ executed: Object.freeze(executed) });
    } finally {
      if (lockHeld) {
        await connection.query("SELECT RELEASE_LOCK(?)", [this.lockName]).catch(() => {});
      }
      connection.release();
    }
  }

  #validate() {
    if (!this.pool) {
      throw new TypeError("SeedRunner requires a valid MySQL connection pool");
    }
    const ids = this.seeds.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      throw new TypeError("Seed IDs must be unique");
    }
    this.seeds.forEach((seed) => {
      if (!seed.id || typeof seed.run !== "function") {
        throw new TypeError("Each seed requires an id string and a run() async function");
      }
    });
  }
}

module.exports = SeedRunner;
