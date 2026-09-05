'use strict';

class DatabaseConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.host = reader.requireString('ORCHESTRATOR_DB_HOST');
    this.port = reader.requireNumber('ORCHESTRATOR_DB_PORT');
    this.database = reader.requireString('ORCHESTRATOR_DB_NAME');
    this.user = reader.requireString('ORCHESTRATOR_DB_USER');
    this.password = reader.getOptionalString('ORCHESTRATOR_DB_PASSWORD', '');
    this.connectionLimit = reader.requireNumber('ORCHESTRATOR_DB_POOL_MAX');
    this.minConnections = reader.requireNumber('ORCHESTRATOR_DB_POOL_MIN');
    Object.freeze(this);
  }
}

module.exports = DatabaseConfig;
