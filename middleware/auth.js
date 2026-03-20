'use strict';

/**
 * Bearer token authentication middleware.
 * Expects: Authorization: Bearer <API_SECRET>
 */
function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || token !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = auth;
