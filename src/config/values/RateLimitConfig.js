'use strict';

class RateLimitConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.windowMs = reader.getOptionalNumber('API_RATE_LIMIT_WINDOW_MS', 60000);
    this.max = reader.getOptionalNumber('API_RATE_LIMIT_MAX', 120);
    Object.freeze(this);
  }
}

module.exports = RateLimitConfig;
