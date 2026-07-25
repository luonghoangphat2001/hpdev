'use strict';

const TransactionManager = require('../../../src/infrastructure/database/transaction-manager');
const MysqlEventRepository = require('../../../src/infrastructure/database/repositories/mysql-event.repository');
const MysqlWorkflowRepository = require('../../../src/infrastructure/database/repositories/mysql-workflow.repository');
const OptimisticLockError = require('../../../src/domain/errors/optimistic-lock.error');

describe('database repository layer', () => {
  it('commits successful work and always releases the connection', async () => {
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    const manager = new TransactionManager({
      getConnection: jest.fn().mockResolvedValue(connection),
    });

    await expect(manager.execute(async (tx) => {
      expect(tx).toBe(connection);
      return 'done';
    })).resolves.toBe('done');
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back failed work and rethrows the original error', async () => {
    const failure = new Error('failed');
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    const manager = new TransactionManager({
      getConnection: jest.fn().mockResolvedValue(connection),
    });

    await expect(manager.execute(() => { throw failure; })).rejects.toBe(failure);
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('persists event JSON through an injected executor', async () => {
    const executor = {
      execute: jest.fn()
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ event_id: 'evt_1' }]]),
    };
    const repository = new MysqlEventRepository(executor);

    await expect(repository.create({
      eventId: 'evt_1',
      schemaVersion: '1.0.0',
      eventType: 'order.created',
      source: 'ecommerce',
      occurredAt: new Date(),
      receivedAt: new Date(),
      correlationId: 'cor_1',
      deliveryId: 'delivery_1',
      rawPayload: { order: 1 },
      payloadHash: 'a'.repeat(64),
      signatureValid: true,
      signatureKeyId: 'key_1',
    })).resolves.toEqual({ event_id: 'evt_1' });

    expect(executor.execute.mock.calls[0][1]).toContain('{"order":1}');
  });

  it('performs workflow transitions with optimistic version matching', async () => {
    const executor = {
      execute: jest.fn()
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ workflow_id: 'wf_1', state_version: 2 }]]),
    };
    const repository = new MysqlWorkflowRepository(executor);

    await expect(repository.transition('wf_1', 1, { state: 'running' }))
      .resolves.toMatchObject({ state_version: 2 });
    expect(executor.execute.mock.calls[0][0]).toContain(
      'WHERE workflow_id = ? AND state_version = ?',
    );
  });

  it('raises a domain error when optimistic transition loses a race', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([{ affectedRows: 0 }]),
    };
    const repository = new MysqlWorkflowRepository(executor);

    await expect(repository.transition('wf_1', 3, { state: 'completed' }))
      .rejects.toBeInstanceOf(OptimisticLockError);
  });
});
