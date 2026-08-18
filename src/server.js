'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./services/logger.service');
const mysqlPoolFactory = require('./infrastructure/database/mysql-pool');
const MigrationRunner = require('./infrastructure/database/migration-runner');
const { buildDailyReportScheduler } = require('./composition/daily-report.composition');
const { buildCeoDailyBriefScheduler } = require('./composition/ceo-daily-brief.composition');

class Server {
  constructor(
    expressApp = app,
    config = env,
    { poolFactory = mysqlPoolFactory, MigrationRunnerClass = MigrationRunner } = {}
  ) {
    this.app = expressApp;
    this.config = config;
    this.poolFactory = poolFactory;
    this.MigrationRunnerClass = MigrationRunnerClass;
  }

  async start() {
    await this.migrateDatabase();
    return this.listen();
  }

  async migrateDatabase() {
    const pool = this.poolFactory.create(this.config.orchestratorDatabase);
    try {
      const result = await new this.MigrationRunnerClass({ pool }).run();
      logger.info('[OpenClaw] Database schema ready', {
        appliedMigrations: result.executed,
      });
      return result;
    } finally {
      await pool.end();
    }
  }

  listen() {
    if (!this.config.port) {
      throw new Error('PORT is required when OpenClaw runs as a standalone server');
    }

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
    if (this.config.dailyBrief?.enabled) {
      this.ceoDailyBriefScheduler = buildCeoDailyBriefScheduler({ config: this.config });
      this.ceoDailyBriefScheduler.start();
      server.on('close', () => this.ceoDailyBriefScheduler.stop());
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

  new Server().start().catch((error) => {
    logger.error('[OpenClaw] Startup failed', { error: logger.formatError(error) });
    process.exitCode = 1;
  });
}

module.exports = Server;
