'use strict';

class DatabaseConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.host = reader.requireString('DB_HOST');
    this.port = reader.requireNumber('DB_PORT');
    this.user = reader.requireString('DB_USER');
    this.password = reader.getOptionalString('DB_PASSWORD', '');
    this.database = reader.requireString('DB_NAME');
    this.waitForConnections = true;
    this.connectionLimit = 5;
    this.dateStrings = true;
    Object.freeze(this);
  }
}

module.exports = DatabaseConfig;
