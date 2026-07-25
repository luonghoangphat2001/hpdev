'use strict';

class SecretRotationService {
  constructor({ currentSecretKey = 'v1_secret' } = {}) {
    this.activeSecretKey = currentSecretKey;
    this.revokedKeys = new Set();
  }

  rotateSecret(newSecretKey) {
    if (!newSecretKey) throw new Error('New secret key required');
    this.revokedKeys.add(this.activeSecretKey);
    this.activeSecretKey = newSecretKey;
    return Object.freeze({ activeSecretKey: this.activeSecretKey, rotatedAt: new Date().toISOString() });
  }

  isKeyActive(secretKey) {
    return secretKey === this.activeSecretKey && !this.revokedKeys.has(secretKey);
  }
}

module.exports = SecretRotationService;
