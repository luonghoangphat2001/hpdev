'use strict';

/**
 * Admin dashboard controller for existing study reminders.
 */
class StudyScheduleController {
  /** @type {import('../models/ScheduleRepository')} */
  #scheduleRepo;

  /** @param {import('../models/ScheduleRepository')} scheduleRepo */
  constructor(scheduleRepo) {
    this.#scheduleRepo = scheduleRepo;
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  async list(req, res) {
    const includeInactive = req.query.include_inactive === '1';
    const rows = await this.#scheduleRepo.findAll({ limit: req.query.limit || 200, includeInactive });
    res.json({ schedules: rows });
  }

  async create(req, res) {
    const data = StudyScheduleController.#normalize(req.body);
    const error = StudyScheduleController.#validate(data);
    if (error) return res.status(400).json({ error });
    const id = await this.#scheduleRepo.create(data);
    res.json({ ok: true, id });
  }

  async update(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid schedule id' });
    const data = StudyScheduleController.#normalize(req.body, true);
    const error = StudyScheduleController.#validate(data, true);
    if (error) return res.status(400).json({ error });
    const ok = await this.#scheduleRepo.updateAdmin(id, data);
    res.json({ ok });
  }

  async remove(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid schedule id' });
    const ok = await this.#scheduleRepo.deleteAdmin(id);
    res.json({ ok });
  }

  static #normalize(body, partial = false) {
    const out = {};
    const map = {
      user_id: 'userId',
      username: 'username',
      platform: 'platform',
      channel_id: 'channelId',
      title: 'title',
      remind_at: 'remindAt',
      repeat_type: 'repeatType',
      is_active: 'isActive',
    };
    for (const [src, dst] of Object.entries(map)) {
      if (body[src] !== undefined || !partial) out[dst] = body[src];
    }
    if (out.platform) out.platform = String(out.platform).trim() || 'discord';
    if (out.repeatType) out.repeatType = String(out.repeatType).trim() || 'none';
    if (out.isActive !== undefined) out.isActive = out.isActive ? 1 : 0;
    return out;
  }

  static #validate(data, partial = false) {
    if (!partial || data.userId !== undefined) {
      if (!data.userId) return 'user_id is required';
    }
    if (!partial || data.title !== undefined) {
      if (!data.title) return 'title is required';
    }
    if (!partial || data.remindAt !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(data.remindAt || ''))) {
        return 'remind_at must be YYYY-MM-DD HH:MM:SS';
      }
    }
    if (data.repeatType !== undefined && !['none', 'daily', 'weekly'].includes(data.repeatType)) {
      return 'repeat_type must be none, daily, or weekly';
    }
    return null;
  }
}

module.exports = StudyScheduleController;
