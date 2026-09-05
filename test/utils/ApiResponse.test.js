'use strict';

const ApiResponse = require('../../src/utils/ApiResponse');

describe('ApiResponse', () => {
  function fakeRes() {
    const res = {
      statusCode: 200,
      body: null,
    };
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((payload) => {
      res.body = payload;
      return res;
    });
    res.send = jest.fn().mockImplementation(() => res);
    return res;
  }

  test('success sends 200 status with ok: true and success: true', () => {
    const res = fakeRes();
    ApiResponse.success(res, { foo: 'bar' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({
      success: true,
      ok: true,
      foo: 'bar',
    });
  });

  test('created sends 201 status', () => {
    const res = fakeRes();
    ApiResponse.created(res, { id: 123 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(123);
  });

  test('error sends uniform error format', () => {
    const res = fakeRes();
    ApiResponse.error(res, 'Test error message', 400, 'TEST_CODE');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      success: false,
      ok: false,
      error: 'Test error message',
      code: 'TEST_CODE',
    });
  });

  test('unauthorized sends 401 status with error and code', () => {
    const res = fakeRes();
    ApiResponse.unauthorized(res, 'Token expired', 'TOKEN_EXPIRED');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token expired');
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  test('forbidden sends 403 status', () => {
    const res = fakeRes();
    ApiResponse.forbidden(res, 'Access denied', 'FORBIDDEN');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toBe('Access denied');
  });
});
