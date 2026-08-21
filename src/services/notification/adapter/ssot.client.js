/**
 * @fileoverview ssot.client - Provides ssot functionality.
 */
'use strict';

const axios = require('axios');
const env = require('../../../config/env');

const STATUS_ERROR_CODES = Object.freeze({
  400: 'ssot_validation_error',
  401: 'ssot_authentication_failed',
  403: 'ssot_permission_denied',
  404: 'ssot_resource_not_found',
  409: 'ssot_version_conflict',
  422: 'ssot_business_rule_rejected',
  429: 'ssot_rate_limited',
});

/**
 * SsotClientError
 * Manages ssot client error logic.
 */
class SsotClientError extends Error {
  /**
   * constructor - Executes constructor.
   * @param {*} message - Input parameter.
   * @param {*} statusCode - Input parameter.
   * @param {*} code - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(message, { statusCode = 502, code = 'ssot_request_failed' } = {}) {
    super(message);
    this.name = 'SsotClientError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * SsotClient
 * Manages ssot client logic.
 */
class SsotClient {
  constructor({
    httpClient = axios,
    config = env.ecommerceApi,
  } = {}) {
    this.httpClient = httpClient;
    this.config = config;
    this.assertConfigured();
  }

  /**
   * assertConfigured - Executes assert configured.
   * @returns {*} Result of operation.
   */
  assertConfigured() {
    const missing = ['baseUrl', 'agentCode', 'agentToken']
      .filter((field) => !this.config[field]);
    if (missing.length > 0) {
      throw new TypeError(`SSOT client configuration missing: ${missing.join(', ')}`);
    }
  }

  async request({
    method,
    path,
    params,
    data,
    idempotencyKey,
    expectedResourceVersion,
    timeoutMs = 10000,
  }) {
    try {
      const response = await this.httpClient.request({
        method,
        url: `${this.config.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
        params,
        data,
        timeout: timeoutMs,
        headers: {
          Authorization: `Bearer ${this.config.agentToken}`,
          'X-Agent-Code': this.config.agentCode,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
          ...(expectedResourceVersion
            ? { 'If-Match': expectedResourceVersion }
            : {}),
        },
      });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status || 502;
      const fallbackCode = statusCode >= 500
        ? 'ssot_upstream_unavailable'
        : 'ssot_request_failed';
      throw new SsotClientError(
        error.response?.data?.message || 'SSOT request failed',
        {
          statusCode,
          code: STATUS_ERROR_CODES[statusCode]
            || (error.code === 'ECONNABORTED' ? 'ssot_timeout' : fallbackCode),
        },
      );
    }
  }

  /**
   * ping - Asynchronously executes ping.
   * @param {*} timeoutMs - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async ping({ timeoutMs = 5000 } = {}) {
    return this.request({
      method: 'GET',
      path: '/api/v1/storefront/agents/health',
      timeoutMs,
    });
  }
}

module.exports = SsotClient;
module.exports.SsotClientError = SsotClientError;
module.exports.STATUS_ERROR_CODES = STATUS_ERROR_CODES;
