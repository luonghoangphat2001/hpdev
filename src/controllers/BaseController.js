/**
 * @fileoverview BaseController - Provides base functionality.
 */
'use strict';

/**
 * Base Controller providing standardized Express response helpers
 * and OOP baseline for all OpenClaw controllers.
 */
class BaseController {
  /**
   * ok - Executes ok.
   * @param {*} res - Input parameter.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  ok(res, data) {
    if (typeof res.status === 'function') {
      return res.status(200).json(data);
    }
    return res.json(data);
  }

  /**
   * created - Executes created.
   * @param {*} res - Input parameter.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  created(res, data) {
    if (typeof res.status === 'function') {
      return res.status(201).json(data);
    }
    return res.json(data);
  }

  /**
   * accepted - Executes accepted.
   * @param {*} res - Input parameter.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  accepted(res, data) {
    if (typeof res.status === 'function') {
      return res.status(202).json(data);
    }
    return res.json(data);
  }

  /**
   * noContent - Executes no content.
   * @param {*} res - Input parameter.
   * @returns {*} Result of operation.
   */
  noContent(res) {
    return res.status(204).send();
  }

  /**
   * badRequest - Executes bad request.
   * @param {*} res - Input parameter.
   * @param {*} message - Input parameter.
   * @returns {*} Result of operation.
   */
  badRequest(res, message = 'Bad request') {
    return res.status(400).json({ ok: false, error: message });
  }

  /**
   * notFound - Executes not found.
   * @param {*} res - Input parameter.
   * @param {*} message - Input parameter.
   * @returns {*} Result of operation.
   */
  notFound(res, message = 'Resource not found') {
    return res.status(404).json({ ok: false, error: message });
  }

  /**
   * error - Executes error.
   * @param {*} res - Input parameter.
   * @param {*} message - Input parameter.
   * @param {*} statusCode - Input parameter.
   * @returns {*} Result of operation.
   */
  error(res, message = 'Internal server error', statusCode = 500) {
    return res.status(statusCode).json({ ok: false, error: message });
  }
}

module.exports = BaseController;
