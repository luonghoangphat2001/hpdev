'use strict';

const TokenService = require('@services/auth/token.service');

describe('OpenClaw TokenService', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-token-service-key-1234';
  });
  test('generates valid token and verifies payload', () => {
    const payload = { userId: 'ceo-1', username: 'admin', role: 'admin' };
    const token = TokenService.generateToken(payload, 3600);

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const result = TokenService.verifyToken(token);
    expect(result).not.toBeNull();
    expect(result.payload.userId).toBe('ceo-1');
    expect(result.payload.username).toBe('admin');
  });

  test('rejects expired token', () => {
    const token = TokenService.generateToken({ userId: '1' }, -10);
    const result = TokenService.verifyToken(token);
    expect(result).toEqual({ error: 'Token đã hết hạn. Vui lòng đăng nhập lại.', expired: true });
  });

  test('rejects invalid or tampered token', () => {
    const token = TokenService.generateToken({ userId: '1' }, 3600);
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.fakeSignature`;
    const result = TokenService.verifyToken(tampered);
    expect(result).toBeNull();
  });
});
