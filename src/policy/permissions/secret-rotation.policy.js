/**
 * @fileoverview secret-rotation.policy - Provides secret-rotation functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * SecretRotationPolicy
 * Manages secret rotation logic.
 */
class SecretRotationPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} currentSecretKey - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ currentSecretKey = 'v1_secret' } = {}) {
    super({ name: 'SecretRotationPolicy' });


    this.activeSecretKey = currentSecretKey;
    this.revokedKeys = new Set();
  }

  /**
   * rotateSecret - Executes rotate secret.
   * @param {*} newSecretKey - Input parameter.
   * @returns {*} Result of operation.
   */
  rotateSecret(newSecretKey) {
    if (!newSecretKey) throw new Error('New secret key required');
    this.revokedKeys.add(this.activeSecretKey);
    this.activeSecretKey = newSecretKey;
    return Object.freeze({ activeSecretKey: this.activeSecretKey, rotatedAt: new Date().toISOString() });
  }

  /**
   * isKeyActive - Executes is key active.
   * @param {*} secretKey - Input parameter.
   * @returns {*} Result of operation.
   */
  isKeyActive(secretKey) {
    return secretKey === this.activeSecretKey && !this.revokedKeys.has(secretKey);
  }
}

module.exports = SecretRotationPolicy;
