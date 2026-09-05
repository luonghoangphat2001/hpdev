/**
 * @fileoverview server - Provides server functionality.
 */
'use strict';

require('module-alias/register');

const app = require('@app');
const config = require('@config');
const logger = require('@utils/logger.service');
const mysqlPoolFactory = require('@database/mysql-pool');
const MigrationRunner = require('@database/migration-runner');
const { buildDailyReportScheduler } = require('@services/reporting/daily/daily-report.builder');
const { buildCeoDailyBriefScheduler } = require('@services/ceo/daily/daily-brief.builder');

/**
 * Server
 * Manages server logic.
 */
class Server {
  constructor(
    expressApp = app,
    appConfig = config,
    { poolFactory = mysqlPoolFactory, MigrationRunnerClass = MigrationRunner } = {}
  ) {
    this.app = expressApp;
    this.config = appConfig;
    this.poolFactory = poolFactory;
    this.MigrationRunnerClass = MigrationRunnerClass;
  }

  /**
   * start - Asynchronously executes start.
   * @returns {*} Promise resolving result.
   */
  async start() {
    await this.migrateDatabase();
    return this.listen();
  }

  /**
   * migrateDatabase - Asynchronously executes migrate database.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * listen - Executes listen.
   * @returns {*} Result of operation.
   */
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
    console.error('[OpenClaw] Startup failed:', error);
    logger.error('[OpenClaw] Startup failed', { error: logger.formatError(error) });
    process.exitCode = 1;
  });
}


module.exports = Server;
