'use strict';

const ConfigController = require('../../src/controllers/ConfigController');

describe('ConfigController', () => {
  let mockConfigRepo;
  let controller;

  beforeEach(() => {
    mockConfigRepo = {
      get: jest.fn((k) => {
        if (k === 'active_model') {
          return 'gemini';
        }
        if (k === 'log_retention_days') {
          return '30';
        }
        return '';
      }),
      set: jest.fn().mockResolvedValue(true),
    };
    controller = new ConfigController(mockConfigRepo);
  });

  test('get returns log_retention_days and active_model', () => {
    const res = {
      json: jest.fn(),
    };
    controller.get({}, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        active_model: 'gemini',
        log_retention_days: 30,
      })
    );
  });

  test('update saves log_retention_days and other configs', async () => {
    const req = {
      body: {
        active_model: 'claude',
        log_retention_days: 7,
      },
    };
    const res = {
      json: jest.fn(),
    };
    await controller.update(req, res);
    expect(mockConfigRepo.set).toHaveBeenCalledWith('active_model', 'claude');
    expect(mockConfigRepo.set).toHaveBeenCalledWith('log_retention_days', '7');
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });
});
