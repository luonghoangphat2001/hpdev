'use strict';

const Database = require('../../models/Database');
const TaskRepository = require('../../models/TaskRepository');

class TaskService {
  /** @type {import('../../models/TaskRepository')|null} */
  #taskRepo;

  /**
   * @param {import('../../models/TaskRepository')|null} [taskRepo]
   */
  constructor(taskRepo = null) {
    this.#taskRepo = taskRepo;
  }

  async #getRepo() {
    if (this.#taskRepo) return this.#taskRepo;
    const db = await Database.getInstance();
    return new TaskRepository(db);
  }

  /**
   * Create a task record and start agentChat in the background.
   *
   * @param {object}                      opts
   * @param {import('../ai/AIService')}   opts.aiService         Injected — already constructed
   * @param {string}                      opts.userId
   * @param {string}                      opts.username
   * @param {string}                      opts.platform          'discord' | 'telegram'
   * @param {string}                      opts.channelId
   * @param {string}                      opts.description       Short summary for dashboard
   * @param {string}                      opts.prompt            Full prompt for agentChat
   * @param {import('../openclaw/OpenClawService')} opts.openClawService
   * @param {Function}                    opts.onComplete        callback(resultText, error)
   * @returns {Promise<number>} taskId
   */
  async createAndRun({
    aiService,
    userId,
    username,
    platform,
    channelId,
    description,
    prompt,
    openClawService,
    schedulerService = null,
    onComplete,
  }) {
    const taskRepo = await this.#getRepo();

    const taskId = await taskRepo.create({
      userId,
      username,
      platform,
      channelId,
      description,
    });
    await taskRepo.updateStatus(taskId, 'running');

    // Fire-and-forget background execution
    (async () => {
      try {
        const result = await aiService.agentChat({
          channelId,
          userId,
          username,
          prompt: prompt || description,
          platform,
          openClawService,
          schedulerService,
        });
        await taskRepo.updateStatus(taskId, 'done', result);
        if (typeof onComplete === 'function') {
          onComplete(result, null);
        }
      } catch (err) {
        await taskRepo.updateStatus(taskId, 'failed', err.message);
        if (typeof onComplete === 'function') {
          onComplete(null, err);
        }
      }
    })();

    return taskId;
  }
}

module.exports = TaskService;
