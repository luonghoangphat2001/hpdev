'use strict';

const Database       = require('@models/Database');
const TaskRepository = require('@models/TaskRepository');

class TaskController {
  /** @type {import('../models/TaskRepository')} */
  #taskRepo;

  /** @param {import('../models/TaskRepository')} [taskRepo] */
  constructor(taskRepo = null) {
    this.#taskRepo = taskRepo;
    this.list = this.list.bind(this);
    this.get = this.get.bind(this);
  }

  async #getRepo() {
    if (this.#taskRepo) return this.#taskRepo;
    const db = await Database.getInstance();
    return new TaskRepository(db);
  }

  async list(req, res) {
    try {
      const repo = await this.#getRepo();
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      res.json({ tasks: await repo.findAll(limit) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async get(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
      const repo = await this.#getRepo();
      const task = await repo.findOne(id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ task });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = TaskController;
