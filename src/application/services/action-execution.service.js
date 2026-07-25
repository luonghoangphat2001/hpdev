'use strict';

const crypto = require('crypto');
const { stableSerialize } = require('../../contracts/identity/correlation-convention');

class ActionExecutionService {
  constructor({
    writeAdapter,
    actionRepository,
    clock = () => new Date(),
  }) {
    this.writeAdapter = writeAdapter;
    this.actionRepository = actionRepository;
    this.clock = clock;
  }

  async execute(action, {
    grantedPermissions,
    approval = null,
  }) {
    try {
      const receipt = await this.writeAdapter.execute(
        action.action_name,
        this.parseJson(action.request_payload),
        {
          actionId: action.action_id,
          idempotencyKey: action.idempotency_key,
          expectedResourceVersion: action.expected_resource_version,
          grantedPermissions,
          approval,
        },
      );
      const receiptHash = crypto.createHash('sha256')
        .update(stableSerialize(receipt))
        .digest('hex');
      await this.actionRepository.markCompleted(
        action.action_id,
        receipt,
        receiptHash,
        this.clock(),
      );
      return Object.freeze({
        action_id: action.action_id,
        status: 'completed',
        receipt,
        receipt_hash: receiptHash,
      });
    } catch (error) {
      if (error.code !== 'ssot_version_conflict') {
        throw error;
      }

      const failure = {
        code: 'resource_version_conflict',
        message: 'SSOT resource version changed; manual review required',
      };
      await this.actionRepository.markManualReview(action.action_id, failure);
      return Object.freeze({
        action_id: action.action_id,
        status: 'manual_review',
        error: failure,
      });
    }
  }

  parseJson(value) {
    return typeof value === 'string' ? JSON.parse(value) : value;
  }
}

module.exports = ActionExecutionService;
