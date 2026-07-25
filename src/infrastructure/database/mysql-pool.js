'use strict';

const mysql = require('mysql2/promise');
const env = require('../../config/env');

class MysqlPoolFactory {
  constructor(driver = mysql) {
    this.driver = driver;
  }

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
