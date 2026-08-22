'use strict';

const mockQuery = jest.fn();
const mockQueryOne = jest.fn();

const TaskRepository = require('../../src/models/TaskRepository');

describe('TaskRepository', () => {
  let repo;
  let mockDb;

  beforeEach(() => {
    mockQuery.mockClear();
    mockQueryOne.mockClear();
    mockDb = { query: mockQuery, queryOne: mockQueryOne };
    repo = new TaskRepository(mockDb);
  });

  it('create() inserts task and returns insertId', async () => {
    mockQuery.mockResolvedValue({ insertId: 101, affectedRows: 1 });

    const id = await repo.create({
      userId: 'u123',
      username: 'pat',
      platform: 'discord',
      channelId: 'ch1',
      description: 'Test task',
    });

    expect(id).toBe(101);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO agent_tasks'),
      ['u123', 'pat', 'discord', 'ch1', 'Test task']
    );
  });

  it('updateStatus() sets status and completed_at', async () => {
    mockQuery.mockResolvedValue({ affectedRows: 1 });

    await repo.updateStatus(101, 'done', 'Success result');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE agent_tasks'),
      ['done', 'Success result', 101]
    );
  });

  it('findAll() returns tasks array with bounded limit', async () => {
    const tasks = [{ id: 1, description: 'Task 1' }, { id: 2, description: 'Task 2' }];
    mockQuery.mockResolvedValue(tasks);

    const result = await repo.findAll(25);

    expect(result).toEqual(tasks);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, user_id, username'),
      [25]
    );
  });

  it('findOne() returns single task from queryOne', async () => {
    const task = { id: 1, description: 'Task 1', status: 'done' };
    mockQueryOne.mockResolvedValue(task);

    const result = await repo.findOne(1);

    expect(result).toEqual(task);
    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = ? LIMIT 1'),
      [1]
    );
  });
});
