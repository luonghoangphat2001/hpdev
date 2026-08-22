'use strict';

const ModelsController = require('../../src/controllers/ModelsController');
const { memoryCache } = require('../../src/cache');

describe('ModelsController', () => {
  let controller;
  let mockConfigRepo;

  beforeEach(() => {
    memoryCache.flush();
    mockConfigRepo = {
      get: jest.fn().mockReturnValue(''),
      set: jest.fn(),
    };
    controller = new ModelsController(mockConfigRepo);
  });

  function mockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  }

  it('returns 400 for unknown provider', async () => {
    const req = { params: { provider: 'unknown_ai' } };
    const res = mockRes();

    await controller.list(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Unknown provider');
  });

  it('handles missing provider credentials gracefully', async () => {
    const prevKey = process.env.GEMINI_KEY;
    delete process.env.GEMINI_KEY;

    const req = { params: { provider: 'gemini' } };
    const res = mockRes();

    await controller.list(req, res);

    expect(res.jsonData.unavailable).toBe(true);
    expect(res.jsonData.disabled).toBe(true);
    expect(res.jsonData.models).toEqual([]);
    expect(res.jsonData.error).toContain('not configured');

    if (prevKey) process.env.GEMINI_KEY = prevKey;
  });
});
