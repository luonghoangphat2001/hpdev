'use strict';

const TokenService = require('../services/auth/TokenService');

/**
 * Controller responsible for authentication requests (login, logout, current user).
 * Adheres to SRP by delegating token lifecycle to TokenService and user verification to UserRepository.
 * Follows DIP by accepting TokenService via constructor injection.
 */
class AuthController {
  /** @type {import('../models/UserRepository')} */
  #userRepo;

  /** @type {typeof import('../services/auth/TokenService')} */
  #tokenService;

  /**
   * @param {import('../models/UserRepository')} userRepo
   * @param {typeof import('../services/auth/TokenService')} [tokenService]
   */
  constructor(userRepo, tokenService = TokenService) {
    this.#userRepo = userRepo;
    this.#tokenService = tokenService;
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
  }

  /**
   * Authenticate user credentials and return session info + Bearer JWT token.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await this.#userRepo.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = this.#userRepo.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!req.session) {
      req.session = {};
    }
    req.session.loggedIn = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    let expiresInSeconds = 604800;
    if (process.env.JWT_EXPIRES_IN) {
      expiresInSeconds = Number(process.env.JWT_EXPIRES_IN);
    }

    const token = this.#tokenService.generateToken(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      expiresInSeconds
    );

    return res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
      token,
      expiresIn: expiresInSeconds,
    });
  }

  /**
   * Destroy user session and clear session cookie.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  logout(req, res) {
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        return res.status(200).json({ ok: true });
      });
      return;
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ ok: true });
  }

  /**
   * Get current authenticated user profile.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMe(req, res) {
    if (!req.session) {
      return res.status(200).json({ user: null });
    }
    if (!req.session.loggedIn) {
      return res.status(200).json({ user: null });
    }

    let userId = null;
    if (req.session.userId) {
      userId = req.session.userId;
    }

    return res.status(200).json({
      id: userId,
      username: req.session.username,
      role: req.session.role,
    });
  }
}

module.exports = AuthController;
