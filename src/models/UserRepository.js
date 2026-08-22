'use strict';

const bcrypt = require('bcryptjs');

/**
 * Repository for the users table.
 * Owns all password hashing so callers never touch bcrypt directly.
 */
class UserRepository {
  /** @type {import('./Database')} */
  #db;

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * Insert the admin user on first run.
   * Accepts a pre-hashed password so the caller can migrate
   * an existing hash from the config table without re-hashing.
   * @param {string} username
   * @param {string|null} passwordHash  bcrypt hash
   */
  async seedAdmin(username, passwordHash) {
    if (!passwordHash) return;
    const existing = await this.findByUsername(username);
    if (!existing) {
      await this.#db.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
        [username, passwordHash]
      );
    }
  }

  /**
   * Ensure default admin user exists on application boot.
   * Encapsulates password hashing and database insertion.
   * @param {string} [username='admin']
   * @param {string} [password='Luonghoangphat12001@']
   * @returns {Promise<void>}
   */
  async ensureDefaultAdmin(username = 'admin', password = 'Luonghoangphat12001@') {
    const existing = await this.findByUsername(username);
    if (!existing) {
      const hash = bcrypt.hashSync(password, 10);
      await this.#db.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
        [username, hash]
      );
      console.log(`[UserRepository] Seeded default admin account (${username})`);
    }
  }


  /**
   * @param {string} username
   * @returns {Promise<any|null>}
   */
  async findByUsername(username) {
    return this.#db.queryOne('SELECT * FROM users WHERE username = ?', [username]);
  }

  /**
   * @returns {Promise<any[]>}
   */
  async findAll() {
    return this.#db.query(
      'SELECT id, username, role, created_at, last_active FROM users ORDER BY created_at ASC'
    );
  }

  /** @param {string} username */
  async updateLastActive(username) {
    await this.#db.query('UPDATE users SET last_active = NOW() WHERE username = ?', [username]);
  }

  /**
   * @param {string} username
   * @param {string} password  plain-text
   * @param {'admin'|'user'} [role]
   */
  async create(username, password, role = 'user') {
    const hash = bcrypt.hashSync(password, 10);
    await this.#db.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hash, role]
    );
  }

  /**
   * @param {string} username
   * @param {string} password  plain-text
   */
  async updatePassword(username, password) {
    const hash = bcrypt.hashSync(password, 10);
    await this.#db.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [hash, username]
    );
  }

  /** @param {string} username */
  async delete(username) {
    await this.#db.query('DELETE FROM users WHERE username = ?', [username]);
  }

  /**
   * Constant-time password verification.
   * @param {string} plaintext
   * @param {string} hash
   * @returns {boolean}
   */
  verifyPassword(plaintext, hash) {
    return bcrypt.compareSync(plaintext, hash);
  }
}

module.exports = UserRepository;
