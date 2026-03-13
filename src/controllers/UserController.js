'use strict';

/**
 * Handles user management (list/create/delete — admin only)
 * and self-service password change (any authenticated user).
 */
class UserController {
  /** @type {import('../models/UserRepository')} */
  #userRepo;

  /** @param {import('../models/UserRepository')} userRepo */
  constructor(userRepo) {
    this.#userRepo = userRepo;
    this.list           = this.list.bind(this);
    this.create         = this.create.bind(this);
    this.remove         = this.remove.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  async list(_req, res) {
    res.json(await this.#userRepo.findAll());
  }

  async create(req, res) {
    const { username, password, role } = req.body;
    if (!username || !password || password.length < 6) {
      return res.status(400).json({ error: 'Username and password (min 6 chars) required' });
    }
    try {
      await this.#userRepo.create(username, password, role === 'admin' ? 'admin' : 'user');
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: 'Username already exists' });
    }
  }

  async remove(req, res) {
    const { username } = req.params;
    if (username === req.session.username) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await this.#userRepo.delete(username);
    res.json({ ok: true });
  }

  async changePassword(req, res) {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    await this.#userRepo.updatePassword(req.session.username, password);
    res.json({ ok: true });
  }
}

module.exports = UserController;
