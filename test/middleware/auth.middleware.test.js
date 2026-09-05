'use strict';

const { AuthMiddleware } = require('@middleware/auth.middleware');
const TokenService = require('@services/auth/token.service');

describe('OpenClaw AuthMiddleware', () => {
  const config = { apiSecret: 'my-openclaw-secret' };
  const middleware = new AuthMiddleware(config, TokenService);

  function createMockRes() {
    const res = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    return res;
  }

  test('allows static secret in Bearer header', () => {
    const req = { headers: { authorization: 'Bearer my-openclaw-secret' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware.handle(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('allows static secret in x-api-key header', () => {
    const req = { headers: { 'x-api-key': 'my-openclaw-secret' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware.handle(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('allows valid JWT token and sets req.user', () => {
    const token = TokenService.generateToken({ userId: 'u1', username: 'ceo' }, 3600);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    const next = jest.fn();

    middleware.handle(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.username).toBe('ceo');
  });

  test('rejects expired JWT token with explicit message', () => {
    const token = TokenService.generateToken({ userId: 'u1' }, -10);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    const next = jest.fn();

    middleware.handle(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error).toBe('Token đã hết hạn. Vui lòng đăng nhập lại.');
  });

  test('rejects request with missing credentials', () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    middleware.handle(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
