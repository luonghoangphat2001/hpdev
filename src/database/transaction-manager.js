/**
 * @fileoverview transaction-manager - Provides transaction-manager functionality.
 */
'use strict';

/**
 * TransactionManager
 * Manages transaction manager logic.
 */
class TransactionManager {
  /**
   * constructor - Executes constructor.
   * @param {*} pool - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * execute - Asynchronously executes execute.
   * @param {*} operation - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async execute(operation) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await operation(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = TransactionManager;
