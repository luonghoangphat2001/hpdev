'use strict';

const mysql = require('mysql2/promise');
const initializeDatabase = require('@database');
const config = require('@config');

/**
 * Singleton database connection pool.
 * Manages all DDL (table creation) and provides a thin query API.
 */
class Database {
  /** @type {Database|null} */
  static #instance = null;

  /** @type {import('mysql2/promise').Pool|null} */
  #pool = null;

  /** @returns {Database} */
  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
  }

  async init() {
    this.#pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 5,
      dateStrings: true,   // return DATE/DATETIME as "YYYY-MM-DD HH:MM:SS" strings, not Date objects
    });

    await initializeDatabase(this);
    console.log('[Database] Ready');
  }

  async query(sql, params = []) {
    const [rows] = await this.#pool.query(sql, params);
    return rows;
  }


  /**
   * Execute a query and return the first row or null.
   * @param {string} sql
   * @param {any[]} [params]
   * @returns {Promise<any|null>}
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] ?? null;
  }
}

module.exports = Database;
