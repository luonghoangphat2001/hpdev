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
    if (req.session?.loggedIn) {
      return next();
    }

    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    return res.redirect('/');
  }

  /**
   * Allow admin users only for API endpoints.
   * Always responds with 403 JSON.
   */
  static admin(req, res, next) {
    if (req.session?.loggedIn && req.session?.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
    });
  }

  /**
   * Allow admin users only for web pages.
   * Redirects non-authenticated users to login, non-admins to /chat.
   */
  static adminWeb(req, res, next) {
    if (!req.session?.loggedIn) {
      return res.redirect('/');
    }

    if (req.session?.role === 'admin') {
      return next();
    }

    return res.redirect('/chat');
  }
}

module.exports = AuthMiddleware;
