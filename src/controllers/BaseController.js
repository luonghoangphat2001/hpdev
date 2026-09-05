/**
 * @fileoverview BaseController - Standardized OOP controller base for OpenClaw.
 * Delegates to ApiResponse for uniform success and error JSON envelopes across all endpoints.
 */
'use strict';

const ApiResponse = require('@utils/api-response');

class BaseController {
  /**
   * Returns a standardized 200 OK success JSON response.
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} [message='']
   * @returns {import('express').Response}
   */
  ok(res, data, message = '') {
    return ApiResponse.success(res, data, 200, message);
  }

  /**
   * Returns a standardized 201 Created success JSON response.
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} [message='']
   * @returns {import('express').Response}
   */
  created(res, data, message = '') {
    return ApiResponse.created(res, data, message);
  }

  /**
   * Returns a standardized 202 Accepted success JSON response.
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} [message='']
   * @returns {import('express').Response}
   */
  accepted(res, data, message = '') {
    return ApiResponse.accepted(res, data, message);
  }

  /**
   * Returns a standardized 204 No Content response.
   * @param {import('express').Response} res
   * @returns {import('express').Response}
   */
  noContent(res) {
    return ApiResponse.noContent(res);
  }

  /**
   * Returns a standardized 400 Bad Request error JSON response.
   * @param {import('express').Response} res
   * @param {string} [message='Bad request']
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  badRequest(res, message = 'Bad request', code = '') {
    return ApiResponse.badRequest(res, message, code);
  }

  /**
   * Returns a standardized 401 Unauthorized error JSON response.
   * @param {import('express').Response} res
   * @param {string} [message='Unauthorized']
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  unauthorized(res, message = 'Unauthorized', code = '') {
    return ApiResponse.unauthorized(res, message, code);
  }

  /**
   * Returns a standardized 404 Not Found error JSON response.
   * @param {import('express').Response} res
   * @param {string} [message='Resource not found']
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  notFound(res, message = 'Resource not found', code = '') {
    return ApiResponse.notFound(res, message, code);
  }

  /**
   * Returns a standardized Error response.
   * @param {import('express').Response} res
   * @param {string} [message='Internal server error']
   * @param {number} [statusCode=500]
   * @param {string} [code='']
   * @returns {import('express').Response}
   */
  error(res, message = 'Internal server error', statusCode = 500, code = '') {
    return ApiResponse.error(res, message, statusCode, code);
  }
}

module.exports = BaseController;
