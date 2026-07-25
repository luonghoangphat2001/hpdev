'use strict';

const crypto = require('crypto');
const identifiers = require('../../../contracts/identity/correlation-convention');
const { stableSerialize } = require('../../../contracts/identity/correlation-convention');

class ReconciliationWorkerService {
  constructor({
    actionRepository,
    outboxRepository,
    deadLetterRepository,
    receiptReader,
    idFactory = identifiers,
    clock = () => new Date(),
    staleAfterMs = 60000,
  }) {
    this.actionRepository = actionRepository;
    this.outboxRepository = outboxRepository;
    this.deadLetterRepository = deadLetterRepository;
    this.receiptReader = receiptReader;
    this.idFactory = idFactory;
    this.clock = clock;
    this.staleAfterMs = staleAfterMs;
  }

  async run(limit = 100) {
    const now = this.clock();
    const before = new Date(now.getTime() - this.staleAfterMs);
    const actions = await this.actionRepository
      .findReconciliationCandidates(before, limit);
    const results = [];

    for (const action of actions) {
      results.push(await this.reconcile(action, now));
    }
    return results;
  }

  async reconcile(action, now = this.clock()) {
    const lookup = await this.receiptReader.lookup(action.idempotency_key);
    if (lookup.status === 'found') {
      const receiptHash = crypto.createHash('sha256')
        .update(stableSerialize(lookup.receipt))
        .digest('hex');
      await this.actionRepository.markCompleted(
        action.action_id,
        lookup.receipt,
        receiptHash,
        now,
      );
      return { action_id: action.action_id, status: 'reconciled' };
    }

    if (lookup.status === 'not_found' && action.retry_count < action.max_attempts) {
      await this.outboxRepository.enqueue({
        jobId: this.idFactory.createId('job'),
        jobKey: `action-retry:${action.action_id}:${action.retry_count + 1}`,
        jobType: 'ssot.action.execute',
        workflowId: action.workflow_id,
        actionId: action.action_id,
        correlationId: action.correlation_id,
        payload: {
          action_name: action.action_name,
          request_payload: this.parseJson(action.request_payload),
          idempotency_key: action.idempotency_key,
        },
        availableAt: now,
      });
      await this.actionRepository.markRetryQueued(action.action_id);
      return { action_id: action.action_id, status: 'retry_queued' };
    }

    const failure = {
      code: 'external_result_unknown',
      message: 'SSOT action outcome could not be proven safely',
    };
    await this.deadLetterRepository.create({
      deadLetterId: this.idFactory.createId('deadLetter'),
      sourceType: 'workflow_action',
      sourceId: action.action_id,
      eventId: action.event_id,
      workflowId: action.workflow_id,
      actionId: action.action_id,
      correlationId: action.correlation_id,
      payloadSnapshot: this.parseJson(action.request_payload),
      payloadHash: action.payload_hash,
      errorCode: failure.code,
      errorMessage: failure.message,
      errorDetails: { lookup_status: lookup.status },
      attemptCount: Math.max(action.retry_count, 1),
      firstFailedAt: action.started_at || now,
      lastFailedAt: now,
    });
    await this.actionRepository.markManualReview(action.action_id, failure);
    return { action_id: action.action_id, status: 'manual_review' };
  }

  parseJson(value) {
    return typeof value === 'string' ? JSON.parse(value) : value;
  }
}

module.exports = ReconciliationWorkerService;
