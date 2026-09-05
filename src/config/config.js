/**
 * @fileoverview Central application configuration for Dan AI API.
 * Adheres strictly to SRP: responsible exclusively for providing strongly-typed,
 * immutable domain configuration Value Objects parsed by EnvReader.
 * Completely decoupled from application bootstrapping and controller instantiation.
 */
'use strict';

require('module-alias/register');
require('dotenv').config();

const EnvReader = require('@config/reader/EnvReader');
const ServerConfig = require('@config/values/ServerConfig');
const CorsConfig = require('@config/values/CorsConfig');
const DatabaseConfig = require('@config/values/DatabaseConfig');
const AuthConfig = require('@config/values/AuthConfig');
const AiConfig = require('@config/values/AiConfig');
const OpenClawConfig = require('@config/values/OpenClawConfig');
const RateLimitConfig = require('@config/values/RateLimitConfig');

class Config {
  /**
   * @param {object} [env=process.env]
   */
  constructor(env = process.env) {
    const reader = new EnvReader(env);
    this.server = new ServerConfig(reader);
    this.cors = new CorsConfig(reader);
    this.database = new DatabaseConfig(reader);
    this.auth = new AuthConfig(reader);
    this.session = this.auth;
    this.ai = new AiConfig(reader);
    this.openclaw = new OpenClawConfig(reader);
    this.rateLimit = new RateLimitConfig(reader);
    this.Config = Config;
    this.EnvReader = EnvReader;
    Object.freeze(this);
  }
}

const config = new Config();

module.exports = config;
