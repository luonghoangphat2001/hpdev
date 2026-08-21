/**
 * @fileoverview correlation - Provides correlation functionality.
 */
'use strict';

const crypto = require('crypto');

const CORRELATION_CONVENTION_VERSION = '1.0.0';
const ID_PREFIXES = Object.freeze({
  event: 'evt',
  workflow: 'wf',
  action: 'act',
  approval: 'apr',
  audit: 'aud',
  job: 'job',
  deadLetter: 'dlq',
  proposal: 'prp',
  task: 'tsk',
  report: 'rpt',
  correlation: 'cor',
});
const REQUIRED_LOG_FIELDS = Object.freeze([
  'timestamp',
  'level',
  'event_id',
  'workflow_id',
  'action_id',
  'agent_id',
  'correlation_id',
  'error_code',
]);

function stableSerialize(value) {
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableSerialize(value[key])}`
    )).join(',')}}`;
  }

  return JSON.stringify(value);
}

/**
 * CorrelationConvention
 * Manages correlation convention logic.
 */
class CorrelationConvention {
  constructor(uuidFactory = () => crypto.randomUUID()) {
    this.uuidFactory = uuidFactory;
  }

  /**
   * createId - Executes create id.
   * @param {*} type - Input parameter.
   * @returns {*} Result of operation.
   */
  createId(type) {
    const prefix = ID_PREFIXES[type];
    if (!prefix) {
      throw new TypeError(`Unknown identifier type: ${type}`);
    }
    return `${prefix}_${this.uuidFactory()}`;
  }

  /**
   * isValidId - Executes is valid id.
   * @param {*} type - Input parameter.
   * @param {*} value - Input parameter.
   * @returns {*} Result of operation.
   */
  isValidId(type, value) {
    const prefix = ID_PREFIXES[type];
    if (!prefix || typeof value !== 'string') {
      return false;
    }

    return new RegExp(`^${prefix}_[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`, 'i')
      .test(value);
  }

  /**
   * createIdempotencyKey - Executes create idempotency key.
   * @param {*} scope - Input parameter.
   * @param {*} operation - Input parameter.
   * @param {*} subject - Input parameter.
   * @param {*} payloadVersion - Input parameter.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
  createIdempotencyKey({ scope, operation, subject, payloadVersion, payload }) {
    const parts = { operation, payload, payloadVersion, subject };
    const digest = crypto
      .createHash('sha256')
      .update(stableSerialize(parts))
      .digest('hex');
    const safeScope = String(scope).toLowerCase().replace(/[^a-z0-9._-]/g, '-');

    return `idem:v1:${safeScope}:${digest}`;
  }

  /**
   * createContext - Executes create context.
   * @param {*} eventId - Input parameter.
   * @param {*} workflowId - Input parameter.
   * @param {*} actionId - Input parameter.
   * @returns {*} Result of operation.
   */
  createContext({ eventId = null, workflowId = null, actionId = null } = {}) {
    return Object.freeze({
      event_id: eventId,
      workflow_id: workflowId,
      action_id: actionId,
      correlation_id: this.createId('correlation'),
    });
  }
}

module.exports = new CorrelationConvention();
module.exports.CorrelationConvention = CorrelationConvention;
module.exports.ID_PREFIXES = ID_PREFIXES;
module.exports.REQUIRED_LOG_FIELDS = REQUIRED_LOG_FIELDS;
module.exports.CORRELATION_CONVENTION_VERSION = CORRELATION_CONVENTION_VERSION;
module.exports.stableSerialize = stableSerialize;
