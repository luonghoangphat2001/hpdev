/**
 * @fileoverview auth.middleware - Provides auth functionality.
 */
'use strict';

const env = require('../config/env');

/**
 * AuthMiddleware
 * Manages auth logic.
 */
class AuthMiddleware {
  /**
   * constructor - Executes constructor.
   * @param {*} config - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(config = env) {
    this.config = config;
  }

  /**
   * handle - Executes handle.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} [next] - Express next middleware function.
   * @returns {*} Result of operation.
   */
  handle(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token || token !== this.config.apiSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
  }
}

const authMiddleware = new AuthMiddleware();

module.exports = authMiddleware.handle.bind(authMiddleware);
module.exports.AuthMiddleware = AuthMiddleware;
