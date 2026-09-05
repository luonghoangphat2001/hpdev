'use strict';

const TokenService = require('../services/auth/TokenService');

/**
 * Authentication and authorization middleware.
 * Adheres to SRP: responsible exclusively for request credential resolution and access policy enforcement.
 * Follows DRY by centralizing role validation and credential resolution logic.
 */
class AuthMiddleware {
  /**
   * Resolves authentication credentials from Bearer token or session.
   * @param {import('express').Request} req
   * @returns {{ authenticated: boolean, user?: object, status: number, error: string }}
   */
  static #resolveAuth(req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        const result = TokenService.verifyToken(token);
        if (result) {
          if (result.payload) {
            if (!req.session) {
              req.session = {};
            }
            req.session.loggedIn = true;
            req.session.userId = result.payload.userId;
            req.session.username = result.payload.username;
            req.session.role = result.payload.role;
            req.user = result.payload;
            return { authenticated: true, user: result.payload, status: 200, error: '' };
          }
          if (result.expired) {
            return { authenticated: false, status: 401, error: 'Token đã hết hạn. Vui lòng đăng nhập lại.' };
          }
        }
        return { authenticated: false, status: 401, error: 'Token không hợp lệ.' };
      }
    }

    if (req.session) {
      if (req.session.loggedIn) {
        return {
          authenticated: true,
          user: {
            userId: req.session.userId,
            username: req.session.username,
            role: req.session.role,
          },
          status: 200,
          error: '',
        };
      }
    }

    return { authenticated: false, status: 401, error: 'Unauthorized' };
  }

  /**
   * Evaluates if authenticated identity possesses administrative privileges.
   * @param {{ user?: { role?: string } }} auth
   * @param {import('express').Request} req
   * @returns {boolean}
   */
  static #hasAdminRole(auth, req) {
    if (auth.user && auth.user.role === 'admin') {
      return true;
    }
    if (req.session && req.session.role === 'admin') {
      return true;
    }
    return false;
  }

  /**
   * Enforces that the incoming request is authenticated.
   * Responds with 401 JSON for API endpoints or redirects web pages to login.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  static user(req, res, next) {
    const auth = AuthMiddleware.#resolveAuth(req);
    if (auth.authenticated) {
      return next();
    }

    if (req.originalUrl.startsWith('/api')) {
      return res.status(auth.status).json({
        error: auth.error,
      });
    }

    return res.redirect('/');
  }

  /**
   * Enforces that the incoming API request has admin privileges.
   * Responds with 401 if unauthenticated or 403 if unauthorized.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  static admin(req, res, next) {
    const auth = AuthMiddleware.#resolveAuth(req);
    if (!auth.authenticated) {
      return res.status(auth.status).json({
        error: auth.error,
      });
    }

    if (AuthMiddleware.#hasAdminRole(auth, req)) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
    });
  }

  /**
   * Enforces that the incoming web request has admin privileges.
   * Redirects unauthenticated users to root and non-admins to /chat.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  static adminWeb(req, res, next) {
    const auth = AuthMiddleware.#resolveAuth(req);
    if (!auth.authenticated) {
      return res.redirect('/');
    }

    if (AuthMiddleware.#hasAdminRole(auth, req)) {
      return next();
    }

    return res.redirect('/chat');
  }
}

module.exports = AuthMiddleware;
