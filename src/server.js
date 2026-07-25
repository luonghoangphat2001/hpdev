'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./services/logger.service');
const { buildDailyReportScheduler } = require('./composition/daily-report.composition');

class Server {
  constructor(expressApp = app, config = env) {
    this.app = expressApp;
    this.config = config;
  }

  listen() {
    const server = this.app.listen(this.config.port, () => {
      const message = `[OpenClaw] Listening on port ${this.config.port}`;
      console.log(message);
      logger.info(message, { port: this.config.port });
    });
    if (this.config.dailyReport?.enabled) {
      this.dailyReportScheduler = buildDailyReportScheduler({ config: this.config });
      this.dailyReportScheduler.start();
      server.on('close', () => this.dailyReportScheduler.stop());
    }
    return server;
  }
}

if (require.main === module) {
  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { error: logger.formatError(err) });
    throw err;
  });

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('unhandledRejection', { error: logger.formatError(err) });
  });

  new Server().listen();
}

module.exports = Server;
