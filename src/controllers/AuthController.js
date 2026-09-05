'use strict';

const TokenService = require('@services/auth/TokenService');
const ApiResponse = require('@utils/ApiResponse');

/**
 * Controller responsible for authentication requests (login, logout, current user).
 * Adheres to SRP by delegating token lifecycle to TokenService and user verification to UserRepository.
 * Follows DIP by accepting TokenService via constructor injection.
 * Uses unified ApiResponse for consistent JSON structures.
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

    if (!username) {
      return ApiResponse.badRequest(res, 'Username and password are required', 'MISSING_CREDENTIALS');
    }
    if (!password) {
      return ApiResponse.badRequest(res, 'Username and password are required', 'MISSING_CREDENTIALS');
    }

    const user = await this.#userRepo.findByUsername(username);
    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid username or password', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = this.#userRepo.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return ApiResponse.unauthorized(res, 'Invalid username or password', 'INVALID_CREDENTIALS');
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

    return ApiResponse.success(res, {
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
        return ApiResponse.success(res, null, 200, 'Logged out successfully');
      });
      return;
    }
    res.clearCookie('connect.sid');
    return ApiResponse.success(res, null, 200, 'Logged out successfully');
  }

  /**
   * Get current authenticated user profile.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMe(req, res) {
    if (!req.session) {
      return ApiResponse.success(res, { user: null });
    }
    if (!req.session.loggedIn) {
      return ApiResponse.success(res, { user: null });
    }

    let userId = null;
    if (req.session.userId) {
      userId = req.session.userId;
    }

    return ApiResponse.success(res, {
      id: userId,
      username: req.session.username,
      role: req.session.role,
    });
  }
}

module.exports = AuthController;
