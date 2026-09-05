'use strict';

const config = require('@config/config');
const TokenService = require('@services/auth/token.service');
const ApiResponse = require('@utils/api-response');

/**
 * Authentication Middleware for OpenClaw.
 * Adheres to SRP: validates incoming caller credentials via Bearer JWT, Service Secret, or x-api-key.
 * Uses unified ApiResponse for consistent 401 error envelopes.
 */
class AuthMiddleware {
  /**
   * @param {*} [appConfig=config]
   * @param {typeof TokenService} [tokenService=TokenService]
   */
  constructor(appConfig = config, tokenService = TokenService) {
    this.config = appConfig;
    this.tokenService = tokenService;
  }

  /**
   * Express middleware handler.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  handle(req, res, next) {
    // 1. Check x-api-key header
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      if (typeof apiKey === 'string' && apiKey === this.config.apiSecret) {
        return next();
      }
    }

    // 2. Check Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader) {
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.slice(7).trim();

        // Service-to-service static secret match
        if (this.config.apiSecret && rawToken === this.config.apiSecret) {
          return next();
        }

        // JWT token verification with expiration timeout
        const result = this.tokenService.verifyToken(rawToken);
        if (result) {
          if (result.payload) {
            req.user = result.payload;
            return next();
          }
          if (result.expired) {
            return ApiResponse.unauthorized(res, 'Token đã hết hạn. Vui lòng đăng nhập lại.', 'TOKEN_EXPIRED');
          }
        }

        return ApiResponse.unauthorized(res, 'Token không hợp lệ.', 'INVALID_TOKEN');
      }
    }

    return ApiResponse.unauthorized(res, 'Unauthorized', 'UNAUTHORIZED');
  }
}

const authMiddleware = new AuthMiddleware();

module.exports = authMiddleware.handle.bind(authMiddleware);
module.exports.AuthMiddleware = AuthMiddleware;
