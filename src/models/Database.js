'use strict';

const mysql = require('mysql2/promise');

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
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
    });

    await this.#createTables();
    console.log('DB ready');
  }

  async #createTables() {
    await this.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id VARCHAR(32) NOT NULL,
        user_id VARCHAR(32) NOT NULL,
        username VARCHAR(64) NOT NULL,
        role VARCHAR(16) NOT NULL,
        content TEXT NOT NULL,
        model VARCHAR(32),
        tokens_in INT NOT NULL DEFAULT 0,
        tokens_out INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_channel (channel_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration: add token columns to existing tables
    await this.#addColumnIfMissing('conversations', 'tokens_in',  'INT NOT NULL DEFAULT 0 AFTER model');
    await this.#addColumnIfMissing('conversations', 'tokens_out', 'INT NOT NULL DEFAULT 0 AFTER tokens_in');

    // Migration: widen model column so full model names fit (e.g. models/gemini-2.5-flash-preview-04-17)
    await this.#widenColumnIfNeeded('conversations', 'model', 'VARCHAR(64)', 32);

    await this.query(`
      CREATE TABLE IF NOT EXISTS config (
        \`key\` VARCHAR(64) PRIMARY KEY,
        value TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','user') NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration: track last active time per user (must run after CREATE TABLE users)
    await this.#addColumnIfMissing('users', 'last_active', 'DATETIME NULL AFTER role');
  }

  /**
   * Add a column to a table only if it does not already exist.
   * @param {string} table
   * @param {string} column
   * @param {string} definition  e.g. 'INT NOT NULL DEFAULT 0 AFTER model'
   */
  /**
   * Widen a VARCHAR column if its current max length is less than needed.
   * @param {string} table
   * @param {string} column
   * @param {string} newType   e.g. 'VARCHAR(64)'
   * @param {number} maxOldLen only alter if current CHARACTER_MAXIMUM_LENGTH <= this value
   */
  async #widenColumnIfNeeded(table, column, newType, maxOldLen) {
    const db = process.env.DB_NAME;
    const row = await this.queryOne(
      'SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [db, table, column]
    );
    if (row && Number(row.CHARACTER_MAXIMUM_LENGTH) <= maxOldLen) {
      await this.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${newType}`);
    }
  }

  async #addColumnIfMissing(table, column, definition) {
    const db = process.env.DB_NAME;
    const exists = await this.queryOne(
      'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [db, table, column]
    );
    if (!exists) {
      await this.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
  }

  /**
   * Execute a query and return all rows.
   * @param {string} sql
   * @param {any[]} [params]
   * @returns {Promise<any[]>}
   */
  async query(sql, params = []) {
    const [rows] = await this.#pool.execute(sql, params);
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
