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
    this.showHome = this.showHome.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
  }

  /** GET / — login page OR redirect to main feature page based on session */
  showHome(req, res) {
    if (!req.session?.loggedIn) {
      return res.render('pages/login');
    }
    return res.redirect(req.session.role === 'admin' ? '/config' : '/chat');
  }

  async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.redirect('/?error=1');
    }

    const user = await this.#userRepo.findByUsername(username);
    if (user && this.#userRepo.verifyPassword(password, user.password_hash)) {
      req.session.loggedIn = true;
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      return res.redirect(user.role === 'admin' ? '/config' : '/chat');
    }
    return res.redirect('/?error=1');
  }

  logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  }

  getMe(req, res) {
    res.json({
      id: req.session.userId || null,
      username: req.session.username,
      role: req.session.role,
    });
  }
}

module.exports = AuthController;
