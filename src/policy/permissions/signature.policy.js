/**
 * @fileoverview signature.policy - Provides signature functionality.
 */
'use strict';

const BasePolicy = require('../BasePolicy');

const crypto = require('crypto');

const SIGNATURE_POLICY = Object.freeze({
  version: 'v1',
  algorithm: 'sha256',
  maxClockSkewSeconds: 300,
  replayTtlSeconds: 600,
  keyRotationOverlapSeconds: 86400,
});

/**
 * SignaturePolicy
 * Manages signature logic.
 */
class SignaturePolicy extends BasePolicy {
  constructor({
    keys,
    now = () => Date.now(),
    policy = SIGNATURE_POLICY,
  }) {
    super({ name: 'SignaturePolicy' });


    if (!keys || Object.keys(keys).length === 0) {
      throw new TypeError('At least one webhook signing key is required');
    }

    this.keys = new Map(Object.entries(keys));
    this.now = now;
    this.policy = policy;
  }

  /**
   * canonicalString - Executes canonical string.
   * @param {*} body - Input parameter.
   * @param {*} timestamp - Input parameter.
   * @param {*} deliveryId - Input parameter.
   * @returns {*} Result of operation.
   */
  canonicalString({ body, timestamp, deliveryId }) {
    if (!deliveryId || !Number.isInteger(Number(timestamp))) {
      throw new TypeError('timestamp and deliveryId are required');
    }

    const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
    const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    return `${this.policy.version}:${timestamp}:${deliveryId}:${bodyHash}`;
  }

  /**
   * sign - Executes sign.
   * @param {*} body - Input parameter.
   * @param {*} timestamp - Input parameter.
   * @param {*} deliveryId - Input parameter.
   * @param {*} keyId - Input parameter.
   * @returns {*} Result of operation.
   */
  sign({ body, timestamp, deliveryId, keyId }) {
    const secret = this.keys.get(keyId);
    if (!secret) {
      throw new TypeError(`Unknown signing key: ${keyId}`);
    }

    const digest = crypto
      .createHmac(this.policy.algorithm, secret)
      .update(this.canonicalString({ body, timestamp, deliveryId }))
      .digest('hex');

    return `${this.policy.version}=${digest}`;
  }

  /**
   * verify - Executes verify.
   * @param {*} body - Input parameter.
   * @param {*} timestamp - Input parameter.
   * @param {*} deliveryId - Input parameter.
   * @param {*} keyId - Input parameter.
   * @param {*} signature - Input parameter.
   * @returns {*} Result of operation.
   */
  verify({ body, timestamp, deliveryId, keyId, signature }) {
    if (!this.isTimestampFresh(timestamp)) {
      return { valid: false, reason: 'timestamp_outside_window' };
    }

    if (!deliveryId) {
      return { valid: false, reason: 'missing_delivery_id' };
    }

    if (!this.keys.has(keyId)) {
      return { valid: false, reason: 'unknown_key_id' };
    }

    if (typeof signature !== 'string' || !signature.startsWith(`${this.policy.version}=`)) {
      return { valid: false, reason: 'invalid_signature_format' };
    }

    const expected = this.sign({ body, timestamp, deliveryId, keyId });
    const actualBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (actualBuffer.length !== expectedBuffer.length) {
      return { valid: false, reason: 'signature_mismatch' };
    }

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer)
      ? {
        valid: true,
        replayKey: this.createReplayKey({ keyId, deliveryId }),
        replayTtlSeconds: this.policy.replayTtlSeconds,
      }
      : { valid: false, reason: 'signature_mismatch' };
  }

  /**
   * isTimestampFresh - Executes is timestamp fresh.
   * @param {*} timestamp - Input parameter.
   * @returns {*} Result of operation.
   */
  isTimestampFresh(timestamp) {
    const timestampSeconds = Number(timestamp);
    if (!Number.isInteger(timestampSeconds)) {
      return false;
    }

    const nowSeconds = Math.floor(this.now() / 1000);
    return Math.abs(nowSeconds - timestampSeconds) <= this.policy.maxClockSkewSeconds;
  }

  /**
   * createReplayKey - Executes create replay key.
   * @param {*} keyId - Input parameter.
   * @param {*} deliveryId - Input parameter.
   * @returns {*} Result of operation.
   */
  createReplayKey({ keyId, deliveryId }) {
    return `webhook:${keyId}:${deliveryId}`;
  }
}

module.exports = SignaturePolicy;
module.exports.SIGNATURE_POLICY = SIGNATURE_POLICY;
