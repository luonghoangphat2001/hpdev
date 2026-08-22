'use strict';

const UserController = require('../../src/controllers/UserController');

describe('UserController', () => {
  let mockUserRepo;
  let controller;

  beforeEach(() => {
    mockUserRepo = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 1,
          username: 'admin',
          role: 'admin',
        },
        {
          id: 2,
          username: 'user1',
          role: 'user',
        },
      ]),
      findByUsername: jest.fn().mockImplementation((username) => {
        if (username === 'user1') {
          return Promise.resolve({
            id: 2,
            username: 'user1',
            role: 'user',
          });
        }
        if (username === 'admin') {
          return Promise.resolve({
            id: 1,
            username: 'admin',
            role: 'admin',
          });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockResolvedValue(true),
      updatePassword: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    };
    controller = new UserController(mockUserRepo);
  });

  test('list returns all users', async () => {
    const res = {
      json: jest.fn(),
    };
    await controller.list({}, res);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 1,
        username: 'admin',
        role: 'admin',
      },
      {
        id: 2,
        username: 'user1',
        role: 'user',
      },
    ]);
  });

  test('create adds a new user with valid input', async () => {
    const req = {
      body: {
        username: 'newuser',
        password: 'password123',
        role: 'user',
      },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    await controller.create(req, res);
    expect(mockUserRepo.create).toHaveBeenCalledWith('newuser', 'password123', 'user');
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });

  test('create rejects password with less than 6 chars', async () => {
    const req = {
      body: {
        username: 'shortpw',
        password: '123',
        role: 'user',
      },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    await controller.create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });

  test('changePassword updates current session user password', async () => {
    const req = {
      session: {
        username: 'admin',
      },
      body: {
        password: 'newsecretpass',
      },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    await controller.changePassword(req, res);
    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith('admin', 'newsecretpass');
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });

  test('updateUserPassword allows admin to update another user password', async () => {
    const req = {
      params: {
        username: 'user1',
      },
      body: {
        password: 'updatedsecret',
      },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    await controller.updateUserPassword(req, res);
    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith('user1', 'updatedsecret');
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });

  test('updateUserPassword returns 404 for non-existent user', async () => {
    const req = {
      params: {
        username: 'unknown',
      },
      body: {
        password: 'updatedsecret',
      },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    await controller.updateUserPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
