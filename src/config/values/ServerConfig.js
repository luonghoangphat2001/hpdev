'use strict';

class ServerConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.port = reader.requireNumber('PORT');
    this.nodeEnv = reader.requireString('NODE_ENV');
    this.appVersion = reader.requireString('APP_VERSION');
    this.trustProxy = reader.requireBoolean('TRUST_PROXY');
    this.ceoDashboardActorId = reader.getOptionalString('CEO_DASHBOARD_ACTOR_ID', null);
    Object.freeze(this);
  }
}

module.exports = ServerConfig;
