'use strict';

const env = require('../config/env');

class AuthMiddleware {
  constructor(config = env) {
    this.config = config;
  }

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
