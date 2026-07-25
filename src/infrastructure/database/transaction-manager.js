'use strict';

class TransactionManager {
  constructor(pool) {
    this.pool = pool;
  }

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
