'use strict';

const crypto = require('crypto');

/**
 * Service responsible for JSON Web Token (JWT) cryptographic generation and verification in OpenClaw.
 * Adheres to SRP: encapsulates JWT signing, payload serialization, and expiration validation.
 */
class TokenService {
  /**
   * Retrieves signing secret from environment.
   * @returns {string}
   */
  static #getSecret() {
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }
    if (process.env.API_SECRET) {
      return process.env.API_SECRET;
    }
    throw new Error('[TokenService] Missing required environment variable: JWT_SECRET or API_SECRET');
  }

  /**
   * Generates a cryptographically signed HMAC-SHA256 JWT with an absolute expiration timeout.
   * @param {{ userId?: number|string, username?: string, role?: string }} payload
   * @param {number} [expiresInSeconds=604800] Default 7 days
   * @returns {string} Compact JWT token
   */
  static generateToken(payload, expiresInSeconds = 604800) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.#getSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies the cryptographic authenticity and expiration of a JWT token.
   * @param {string} token
   * @returns {{ payload?: object, error?: string, expired?: boolean } | null}
   */
  static verifyToken(token) {
    if (!token) {
      return null;
    }
    if (typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.#getSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedSignatureBuffer.length) {
      return null;
    }
    if (!crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { error: 'Token đã hết hạn. Vui lòng đăng nhập lại.', expired: true };
      }
      return { payload };
    } catch {
      return null;
    }
  }
}

module.exports = TokenService;
