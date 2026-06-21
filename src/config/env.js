'use strict';

require('dotenv').config();

class EnvConfig {
  constructor(env = process.env) {
    this.port = env.PORT || 4000;
    this.apiSecret = env.API_SECRET || '';
    this.serperKey = env.SERPER_KEY || '';
  }
}

module.exports = new EnvConfig();
module.exports.EnvConfig = EnvConfig;
