/**
 * @fileoverview api-response - Standardized, unified API response handler for OpenClaw.
 * Follows Single Responsibility Principle (SRP) to guarantee consistent JSON structure
 * across all controllers, routers, and middlewares. Zero || fallback operators.
 */
'use strict';

class ApiResponse {
  /**
   * Sends a standardized success JSON response.
   * @param {import('express').Response} res
   * @param {object|array|null} [data=null]
   * @param {number} [statusCode=200]
   * @param {string} [message='']
   * @returns {import('express').Response}
   */
  static success(res, data = null, statusCode = 200, message = '') {
    const payload = {
      success: true,
      ok: true,
    };
    if (message) {
      payload.message = message;
    }
    if (data !== null && data !== undefined) {
      if (typeof data === 'object' && !Array.isArray(data)) {
        Object.assign(payload, data);
      } else {
        payload.data = data;
      }
    }
    if (typeof res.status === 'function') {
      return res.status(statusCode).json(payload);
    }
    return res.json(payload);
  }

  /**
   * Sends a standardized 201 Created response.
   * @param {import('express').Response} res
   * @param {object|null} [data=null]
   * @param {string} [message='']
   * @returns {import('express').Response}
   */
  static created(res, data = null, message = '') {
    return this.success(res, data, 201, message);
  }

  /**
   * Sends a standardized 202 Accepted response.
   * @param {import('express').Response} res
   * @param {object|null} [data=null]
   * @param {string} [message='']
   * @returns {import('express').Response}
   */
  static accepted(res, data = null, message = '') {
    return this.success(res, data, 202, message);
  }

  /**
   * Sends a standardized 204 No Content response.
   * @param {import('express').Response} res
   * @returns {import('express').Response}
   */
  static noContent(res) {
    if (typeof res.status === 'function') {
      return res.status(204).send();
    }
    return res.send();
  }

  /**
   * Sends a standardized error JSON response.
   * @param {import('express').Response} res
   * @param {string} message
   * @param {number} [statusCode=400]
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  static error(res, message, statusCode = 400, code = '') {
    const payload = {
      success: false,
      ok: false,
      error: message,
    };
    if (code) {
      payload.code = code;
    }
    if (typeof res.status === 'function') {
      return res.status(statusCode).json(payload);
    }
    return res.json(payload);
  }

  /**
   * Sends a standardized 400 Bad Request error.
   * @param {import('express').Response} res
   * @param {string} [message='Bad request']
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  static badRequest(res, message = 'Bad request', code = '') {
    return this.error(res, message, 400, code);
  }

  /**
   * Sends a standardized 401 Unauthorized error.
   * @param {import('express').Response} res
   * @param {string} [message='Unauthorized']
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  static unauthorized(res, message = 'Unauthorized', code = '') {
    return this.error(res, message, 401, code);
  }

  /**
   * Sends a standardized 403 Forbidden error.
   * @param {import('express').Response} res
   * @param {string} [message='Forbidden']
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  static forbidden(res, message = 'Forbidden', code = '') {
    return this.error(res, message, 403, code);
  }

  /**
   * Sends a standardized 404 Not Found error.
   * @param {import('express').Response} res
   * @param {string} [message='Resource not found']
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  static notFound(res, message = 'Resource not found', code = '') {
    return this.error(res, message, 404, code);
  }
}

module.exports = ApiResponse;
