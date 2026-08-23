'use strict';

/**
 * Handles login, logout, and current-user info.
 */
class AuthController {
  /** @type {import('../models/UserRepository')} */
  #userRepo;

  /** @param {import('../models/UserRepository')} userRepo */
  constructor(userRepo) {
    this.#userRepo = userRepo;
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
  }

  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await this.#userRepo.findByUsername(username);
    if (user && this.#userRepo.verifyPassword(password, user.password_hash)) {
      req.session.loggedIn = true;
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  }

  logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.json({ ok: true });
    });
  }

  getMe(req, res) {
    if (!req.session?.loggedIn) {
      return res.json({ user: null });
    }
    res.json({
      id: req.session.userId || null,
      username: req.session.username,
      role: req.session.role,
    });
  }
}


module.exports = AuthController;
