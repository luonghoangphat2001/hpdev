'use strict';

const CeoController = require('@controllers/CeoController');

describe('CeoController', () => {
  let mockDispatcher;
  let mockExceptionService;
  let controller;
  let res;

  beforeEach(() => {
    mockDispatcher = {
      dispatch: jest.fn().mockResolvedValue({ status: 'completed', id: 'cmd-1' }),
    };
    mockExceptionService = {
      list: jest.fn().mockResolvedValue([{ id: 'exc-1' }]),
      refresh: jest.fn().mockResolvedValue({ refreshed: 1 }),
      acknowledge: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    controller = new CeoController(mockDispatcher, mockExceptionService);
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('execute dispatches command with payload', async () => {
    const req = {
      params: { commandName: 'scale_up' },
      body: { payload: { workers: 5 }, actorId: 'ceo-1', idempotencyKey: 'idem-1' },
    };
    await controller.execute(req, res);
    expect(mockDispatcher.dispatch).toHaveBeenCalledWith({
      commandName: 'scale_up',
      payload: { workers: 5 },
      actorId: 'ceo-1',
      idempotencyKey: 'idem-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      ok: true,
      receipt: { status: 'completed', id: 'cmd-1' },
    }));
  });

  test('list returns exceptions with custom limit', async () => {
    const req = { query: { limit: '25' } };
    await controller.list(req, res);
    expect(mockExceptionService.list).toHaveBeenCalledWith(25);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      ok: true,
      count: 1,
      exceptions: [{ id: 'exc-1' }],
    }));
  });

  test('list falls back to 100 limit when query is absent', async () => {
    const req = {};
    await controller.list(req, res);
    expect(mockExceptionService.list).toHaveBeenCalledWith(100);
  });

  test('refresh triggers refresh on exception service', async () => {
    const req = {};
    await controller.refresh(req, res);
    expect(mockExceptionService.refresh).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
  });

  test('acknowledge acknowledges exception with actorId', async () => {
    const req = {
      params: { exceptionId: 'exc-100' },
      body: { actorId: 'admin' },
    };
    await controller.acknowledge(req, res);
    expect(mockExceptionService.acknowledge).toHaveBeenCalledWith('exc-100', 'admin');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
