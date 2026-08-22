'use strict';

const crypto = require('crypto');

class ServiceAuthMiddleware {
  static openClaw(req, res, next) {
    const configured = process.env.OPENCLAW_NOTIFICATION_SECRET || '';
    const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');

    if (!configured || !ServiceAuthMiddleware.#equal(configured, provided)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
  }

  static #equal(expected, actual) {
    const left = Buffer.from(expected);
    const right = Buffer.from(actual);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }
}

module.exports = ServiceAuthMiddleware;
