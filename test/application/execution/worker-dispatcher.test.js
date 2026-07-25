'use strict';

const WorkerDispatcherService = require('../../../src/application/services/execution/worker-dispatcher.service');

describe('WorkerDispatcherService', () => {
  const now = new Date('2026-07-25T00:00:00.000Z');

  function setup(job, handler = jest.fn().mockResolvedValue({ ok: true })) {
    const repository = {
      claimNext: jest.fn().mockResolvedValue(job),
      markDelivered: jest.fn(),
      markRetry: jest.fn(),
      markDead: jest.fn(),
      recoverExpiredLeases: jest.fn().mockResolvedValue(2),
    };
    const service = new WorkerDispatcherService({
      transactionManager: { execute: (operation) => operation({ tx: true }) },
      outboxRepositoryFactory: () => repository,
      executor: {},
      handlers: { notify: handler },
      clock: () => now,
      timeoutMs: 20,
      backoffMs: [100, 500],
    });
    return { service, repository, handler };
  }

  it('claims and delivers one job with its receipt', async () => {
    const job = {
      job_id: 'job_1',
      job_type: 'notify',
      payload: '{"message":"hello"}',
      attempts: 1,
      max_attempts: 3,
    };
    const { service, repository, handler } = setup(job);

    await expect(service.dispatchOne('worker_1')).resolves.toMatchObject({
      status: 'delivered',
      job_id: 'job_1',
    });
    expect(handler).toHaveBeenCalledWith({ message: 'hello' }, job);
    expect(repository.markDelivered).toHaveBeenCalledWith(
      'job_1',
      { ok: true },
      now,
    );
  });

  it('backs off retryable failed jobs below max attempts', async () => {
    const error = Object.assign(new Error('temporary'), { code: 'temporary_error' });
    const { service, repository } = setup({
      job_id: 'job_1',
      job_type: 'notify',
      payload: {},
      attempts: 2,
      max_attempts: 3,
    }, jest.fn().mockRejectedValue(error));

    await expect(service.dispatchOne('worker_1')).resolves.toMatchObject({
      status: 'retry',
    });
    expect(repository.markRetry).toHaveBeenCalledWith(
      'job_1',
      expect.objectContaining({ code: 'temporary_error' }),
      new Date(now.getTime() + 500),
    );
  });

  it('moves exhausted and unknown jobs to dead state', async () => {
    const exhausted = setup({
      job_id: 'job_1',
      job_type: 'notify',
      payload: {},
      attempts: 3,
      max_attempts: 3,
    }, jest.fn().mockRejectedValue(new Error('failed')));
    expect((await exhausted.service.dispatchOne('worker_1')).status).toBe('dead');
    expect(exhausted.repository.markDead).toHaveBeenCalled();

    const unknown = setup({
      job_id: 'job_2',
      job_type: 'missing',
      payload: {},
      attempts: 1,
      max_attempts: 3,
    });
    expect((await unknown.service.dispatchOne('worker_1')).status).toBe('dead');
    expect(unknown.repository.markDead).toHaveBeenCalled();
  });

  it('times out slow handlers and schedules retry', async () => {
    const { service, repository } = setup({
      job_id: 'job_1',
      job_type: 'notify',
      payload: {},
      attempts: 1,
      max_attempts: 3,
    }, () => new Promise(() => {}));

    await expect(service.dispatchOne('worker_1')).resolves.toMatchObject({
      status: 'retry',
      error: { code: 'job_timeout' },
    });
    expect(repository.markRetry).toHaveBeenCalled();
  });

  it('recovers expired leases after worker restart', async () => {
    const { service, repository } = setup(null);
    await expect(service.recoverExpiredLeases()).resolves.toBe(2);
    expect(repository.recoverExpiredLeases).toHaveBeenCalledWith(now);
  });
});
