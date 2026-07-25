'use strict';

class WorkerDispatcherService {
  constructor({
    transactionManager,
    outboxRepositoryFactory,
    executor,
    handlers,
    clock = () => new Date(),
    leaseMs = 30000,
    timeoutMs = 10000,
    backoffMs = [250, 1000, 4000],
  }) {
    this.transactionManager = transactionManager;
    this.outboxRepositoryFactory = outboxRepositoryFactory;
    this.executor = executor;
    this.handlers = handlers;
    this.clock = clock;
    this.leaseMs = leaseMs;
    this.timeoutMs = timeoutMs;
    this.backoffMs = backoffMs;
  }

  async dispatchOne(workerId) {
    const job = await this.transactionManager.execute((connection) => {
      const repository = this.outboxRepositoryFactory(connection);
      const now = this.clock();
      return repository.claimNext(
        workerId,
        now,
        new Date(now.getTime() + this.leaseMs),
      );
    });
    if (!job) {
      return { status: 'idle' };
    }

    const repository = this.outboxRepositoryFactory(this.executor);
    const handler = this.handlers[job.job_type];
    if (!handler) {
      const failure = {
        code: 'unknown_job_type',
        message: `No handler registered for ${job.job_type}`,
      };
      await repository.markDead(job.job_id, failure);
      return { status: 'dead', job_id: job.job_id, error: failure };
    }

    try {
      const receipt = await this.withTimeout(
        handler(this.parsePayload(job.payload), job),
        this.timeoutMs,
      );
      await repository.markDelivered(job.job_id, receipt, this.clock());
      return { status: 'delivered', job_id: job.job_id, receipt };
    } catch (error) {
      const failure = {
        code: error.code || 'job_failed',
        message: error.message,
      };
      if (job.attempts >= job.max_attempts) {
        await repository.markDead(job.job_id, failure);
        return { status: 'dead', job_id: job.job_id, error: failure };
      }

      const delay = this.backoffMs[Math.min(job.attempts - 1, this.backoffMs.length - 1)];
      await repository.markRetry(
        job.job_id,
        failure,
        new Date(this.clock().getTime() + delay),
      );
      return { status: 'retry', job_id: job.job_id, error: failure };
    }
  }

  async recoverExpiredLeases() {
    return this.outboxRepositoryFactory(this.executor)
      .recoverExpiredLeases(this.clock());
  }

  parsePayload(payload) {
    return typeof payload === 'string' ? JSON.parse(payload) : payload;
  }

  withTimeout(promise, timeoutMs) {
    let timeout;
    const deadline = new Promise((_resolve, reject) => {
      timeout = setTimeout(() => {
        const error = new Error(`Job exceeded timeout of ${timeoutMs}ms`);
        error.code = 'job_timeout';
        reject(error);
      }, timeoutMs);
    });

    return Promise.race([Promise.resolve(promise), deadline])
      .finally(() => clearTimeout(timeout));
  }
}

module.exports = WorkerDispatcherService;
