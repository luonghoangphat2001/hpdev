'use strict';

class CorsConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.origins = reader.requireArray('CORS_ORIGIN');
    Object.freeze(this);
  }
}

module.exports = CorsConfig;
