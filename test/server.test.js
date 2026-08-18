'use strict';

jest.mock('../src/app', () => ({ listen: jest.fn() }));
jest.mock('../src/services/logger.service', () => ({
  info: jest.fn(),
  error: jest.fn(),
  formatError: jest.fn((error) => error.message),
}));

const Server = require('../src/server');

function createConfig() {
  return {
    port: 3000,
    orchestratorDatabase: { database: 'dan_ai' },
    dailyReport: { enabled: false },
    dailyBrief: { enabled: false },
  };
}

describe('Server startup', () => {
  test('runs database migrations before accepting requests', async () => {
    const events = [];
    const pool = { end: jest.fn(async () => events.push('pool-ended')) };
    const poolFactory = {
      create: jest.fn(() => {
        events.push('pool-created');
        return pool;
      }),
    };
    class TestMigrationRunner {
      constructor(options) {
        expect(options.pool).toBe(pool);
      }

      async run() {
        events.push('migrated');
        return { executed: ['002-create-workflows'] };
      }
    }
    const httpServer = { on: jest.fn() };
    const expressApp = {
      listen: jest.fn((port, callback) => {
        events.push('listening');
        callback();
        return httpServer;
      }),
    };
    const server = new Server(expressApp, createConfig(), {
      poolFactory,
      MigrationRunnerClass: TestMigrationRunner,
    });

    await expect(server.start()).resolves.toBe(httpServer);
    expect(events).toEqual(['pool-created', 'migrated', 'pool-ended', 'listening']);
  });

  test('does not listen and closes the pool when migration fails', async () => {
    const migrationError = new Error('migration failed');
    const pool = { end: jest.fn().mockResolvedValue(undefined) };
    const poolFactory = { create: jest.fn(() => pool) };
    class FailingMigrationRunner {
      async run() {
        throw migrationError;
      }
    }
    const expressApp = { listen: jest.fn() };
    const server = new Server(expressApp, createConfig(), {
      poolFactory,
      MigrationRunnerClass: FailingMigrationRunner,
    });

    await expect(server.start()).rejects.toBe(migrationError);
    expect(pool.end).toHaveBeenCalledTimes(1);
    expect(expressApp.listen).not.toHaveBeenCalled();
  });
});
