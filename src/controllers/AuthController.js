'use strict';

const path = require('path');

const VIEWS_DIR = path.join(__dirname, '../../dashboard/views');

/**
 * Handles login, logout, and current-user info.
 */
class AuthController {
  /** @type {import('../models/UserRepository')} */
  #userRepo;

  /** @param {import('../models/UserRepository')} userRepo */
  constructor(userRepo) {
    this.#userRepo = userRepo;
    this.showLogin   = this.showLogin.bind(this);
    this.login       = this.login.bind(this);
    this.logout      = this.logout.bind(this);
    this.getMe       = this.getMe.bind(this);
  }

  showLogin(req, res) {
    if (req.session?.loggedIn) return res.redirect('/dashboard');
    res.sendFile(path.join(VIEWS_DIR, 'login.html'));
  }

  async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) return res.redirect('/?error=1');

    const user = await this.#userRepo.findByUsername(username);
    if (user && this.#userRepo.verifyPassword(password, user.password_hash)) {
      req.session.loggedIn = true;
      req.session.username = user.username;
      req.session.role     = user.role;
      return res.redirect('/dashboard');
    }
    res.redirect('/?error=1');
  }

  logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  }

  getMe(req, res) {
    res.json({ username: req.session.username, role: req.session.role });
  }
}

module.exports = AuthController;
