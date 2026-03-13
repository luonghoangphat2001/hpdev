'use strict';

/**
 * Role-based authentication middleware.
 * All methods are static so they can be passed directly to Express route definitions.
 */
class AuthMiddleware {
  /**
   * Allow any authenticated user.
   * API requests get a 401 JSON; page requests are redirected to login.
   */
  static user(req, res, next) {
    if (req.session?.loggedIn) return next();
    // Inside the /api router, req.path is e.g. '/me' not '/api/me'
    // Use originalUrl to detect API requests reliably
    if (req.originalUrl.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
    return res.redirect('/');
  }

  /**
   * Allow admin users only.
   * Always responds with 403 JSON — never redirects (admins must reach the page first).
   */
  static admin(req, res, next) {
    if (req.session?.loggedIn && req.session?.role === 'admin') return next();
    return res.status(403).json({ error: 'Forbidden' });
  }
}

module.exports = AuthMiddleware;
