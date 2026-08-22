'use strict';

const TaskController = require('../../src/controllers/TaskController');

describe('TaskController', () => {
  let mockRepo;
  let controller;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue([
        { id: 1, description: 'Task 1', status: 'done' },
        { id: 2, description: 'Task 2', status: 'pending' },
      ]),
      findOne: jest.fn().mockImplementation((id) => {
        if (id === 1) return Promise.resolve({ id: 1, description: 'Task 1', status: 'done' });
        return Promise.resolve(null);
      }),
    };
    controller = new TaskController(mockRepo);
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

  it('list() returns all tasks from injected repository', async () => {
    const req = { query: { limit: '50' } };
    const res = mockRes();

    await controller.list(req, res);

    expect(mockRepo.findAll).toHaveBeenCalledWith(50);
    expect(res.jsonData).toEqual({
      tasks: [
        { id: 1, description: 'Task 1', status: 'done' },
        { id: 2, description: 'Task 2', status: 'pending' },
      ],
    });
  });

  it('get() returns task by id', async () => {
    const req = { params: { id: '1' } };
    const res = mockRes();

    await controller.get(req, res);

    expect(mockRepo.findOne).toHaveBeenCalledWith(1);
    expect(res.jsonData).toEqual({
      task: { id: 1, description: 'Task 1', status: 'done' },
    });
  });

  it('get() returns 404 if task not found', async () => {
    const req = { params: { id: '99' } };
    const res = mockRes();

    await controller.get(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData).toEqual({ error: 'Task not found' });
  });

  it('get() returns 400 for invalid id', async () => {
    const req = { params: { id: 'abc' } };
    const res = mockRes();

    await controller.get(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toEqual({ error: 'Invalid task id' });
  });
});
