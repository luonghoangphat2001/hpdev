/**
 * @fileoverview mysql-pool - Provides mysql-pool functionality.
 */
'use strict';

const mysql = require('mysql2/promise');
const env = require('../config/env');

/**
 * MysqlPoolFactory
 * Manages mysql pool factory logic.
 */
class MysqlPoolFactory {
  /**
   * constructor - Executes constructor.
   * @param {*} driver - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(driver = mysql) {
    this.driver = driver;
  }

  /**
   * create - Executes create.
   * @param {*} config - Input parameter.
   * @returns {*} Result of operation.
   */
  create(config = env.orchestratorDatabase) {
    return this.driver.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      connectionLimit: config.connectionLimit,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      decimalNumbers: true,
      namedPlaceholders: false,
    });
  }
}

module.exports = new MysqlPoolFactory();
module.exports.MysqlPoolFactory = MysqlPoolFactory;
