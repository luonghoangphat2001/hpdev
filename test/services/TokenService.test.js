'use strict';

const TokenService = require('../../src/services/auth/TokenService');

describe('TokenService', () => {
  test('generates valid token and verifies payload', () => {
    const payload = { userId: 1, username: 'admin', role: 'admin' };
    const token = TokenService.generateToken(payload, 3600);

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = TokenService.verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified.payload.userId).toBe(1);
    expect(verified.payload.username).toBe('admin');
    expect(verified.payload.role).toBe('admin');
    expect(verified.payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('rejects expired token', () => {
    const payload = { userId: 2, username: 'user', role: 'user' };
    // -10 seconds expired
    const token = TokenService.generateToken(payload, -10);

    const verified = TokenService.verifyToken(token);
    expect(verified).toEqual({ error: 'Token expired', expired: true });
  });

  test('rejects tampered token', () => {
    const token = TokenService.generateToken({ userId: 1 }, 3600);
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.tamperedSignature`;

    const verified = TokenService.verifyToken(tampered);
    expect(verified).toBeNull();
  });
});
