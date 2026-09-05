'use strict';

class AuthConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.sessionSecret = reader.requireString('SESSION_SECRET');
    this.secret = this.sessionSecret;
    this.cookieSecure = reader.getOptionalBoolean('COOKIE_SECURE', false);
    const jwtSec = reader.getOptionalString('JWT_SECRET', '');
    this.jwtSecret = jwtSec ? jwtSec : this.sessionSecret;
    this.jwtExpiresIn = reader.getOptionalNumber('JWT_EXPIRES_IN', 604800);
    Object.freeze(this);
  }
}

module.exports = AuthConfig;
