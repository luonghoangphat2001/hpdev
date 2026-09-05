'use strict';

const TokenService = require('@services/auth/TokenService');
const ApiResponse = require('@utils/ApiResponse');

/**
 * Authentication and authorization middleware for Dan AI API.
 * Adheres to SRP: responsible exclusively for request credential resolution and access policy enforcement.
 * Follows DRY by centralizing role validation and credential resolution logic.
 * Uses unified ApiResponse for consistent JSON errors across endpoints.
 */
class AuthMiddleware {
  /**
   * Resolves authentication credentials from Bearer token or session.
   * @param {import('express').Request} req
   * @returns {{ user?: object, error?: string, code?: string, status?: number }}
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
            return { user: result.payload };
          }
          if (result.expired) {
            return {
              error: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
              code: 'TOKEN_EXPIRED',
              status: 401,
            };
          }
        }
        return {
          error: 'Token không hợp lệ.',
          code: 'INVALID_TOKEN',
          status: 401,
        };
      }
    }

    if (req.session) {
      if (req.session.loggedIn) {
        return {
          user: {
            userId: req.session.userId,
            username: req.session.username,
            role: req.session.role,
          },
        };
      }
    }

    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
      status: 401,
    };
  }

  /**
   * Evaluates if authenticated identity possesses administrative privileges.
   * @param {{ role?: string }} user
   * @param {import('express').Request} req
   * @returns {boolean}
   */
  static #hasAdminRole(user, req) {
    if (user && user.role === 'admin') {
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
    if (auth.user) {
      req.user = auth.user;
      return next();
    }

    if (req.originalUrl.startsWith('/api')) {
      return ApiResponse.unauthorized(res, auth.error, auth.code);
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
    if (!auth.user) {
      return ApiResponse.unauthorized(res, auth.error, auth.code);
    }

    if (AuthMiddleware.#hasAdminRole(auth.user, req)) {
      req.user = auth.user;
      return next();
    }

    return ApiResponse.forbidden(res, 'Forbidden', 'FORBIDDEN');
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
    if (!auth.user) {
      return res.redirect('/');
    }

    if (AuthMiddleware.#hasAdminRole(auth.user, req)) {
      req.user = auth.user;
      return next();
    }

    return res.redirect('/chat');
  }
}

module.exports = AuthMiddleware;
