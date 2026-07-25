'use strict';

const axios = require('axios');
const env = require('../../config/env');

const STATUS_ERROR_CODES = Object.freeze({
  400: 'ssot_validation_error',
  401: 'ssot_authentication_failed',
  403: 'ssot_permission_denied',
  404: 'ssot_resource_not_found',
  409: 'ssot_version_conflict',
  422: 'ssot_business_rule_rejected',
  429: 'ssot_rate_limited',
});

class SsotClientError extends Error {
  constructor(message, { statusCode = 502, code = 'ssot_request_failed' } = {}) {
    super(message);
    this.name = 'SsotClientError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class SsotClient {
  constructor({
    httpClient = axios,
    config = env.ecommerceApi,
  } = {}) {
    this.httpClient = httpClient;
    this.config = config;
    this.assertConfigured();
  }

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
        },
      });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status || 502;
      throw new SsotClientError(
        error.response?.data?.message || 'SSOT request failed',
        {
          statusCode,
          code: STATUS_ERROR_CODES[statusCode]
            || (error.code === 'ECONNABORTED' ? 'ssot_timeout' : 'ssot_request_failed'),
        },
      );
    }
  }
}

module.exports = SsotClient;
module.exports.SsotClientError = SsotClientError;
module.exports.STATUS_ERROR_CODES = STATUS_ERROR_CODES;
