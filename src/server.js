'use strict';

const app = require('./app');
const env = require('./config/env');

class Server {
  constructor(expressApp = app, config = env) {
    this.app = expressApp;
    this.config = config;
  }

  listen() {
    return this.app.listen(this.config.port, () => {
      console.log(`[OpenClaw] Listening on port ${this.config.port}`);
    });
  }
}

if (require.main === module) {
  new Server().listen();
}

module.exports = Server;
