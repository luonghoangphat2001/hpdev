/**
 * @fileoverview dan-ai.client - Provides dan-ai functionality.
 */
'use strict';

const axios = require('axios');
const env = require('../../../config/env');

/**
 * DanAiNotificationClientError
 * Manages dan ai notification client error logic.
 */
class DanAiNotificationClientError extends Error {
  /**
   * constructor - Executes constructor.
   * @param {*} message - Input parameter.
   * @param {*} statusCode - Input parameter.
   * @param {*} code - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(message, { statusCode = 502, code = 'dan_ai_notification_failed' } = {}) {
    super(message);
    this.name = 'DanAiNotificationClientError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * DanAiClient
 * Manages dan ai client logic.
 */
class DanAiClient {
  constructor({
    httpClient = axios,
    config = env.danAiApi,
  } = {}) {
    this.httpClient = httpClient;
    this.config = config;
    this.#assertConfigured();
  }

  /**
   * sendNotification - Asynchronously executes send notification.
   * @param {*} notification - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async sendNotification(notification) {
    try {
      const response = await this.httpClient.request({
        method: 'POST',
        url: `${this.config.baseUrl.replace(/\/$/, '')}/api/integrations/openclaw/discord-notifications`,
        data: notification,
        timeout: this.config.timeoutMs,
        headers: {
          Authorization: `Bearer ${this.config.apiSecret}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status || 502;
      throw new DanAiNotificationClientError(
        'dan_ai notification request failed',
        {
          statusCode,
          code: error.code === 'ECONNABORTED'
            ? 'dan_ai_notification_timeout'
            : 'dan_ai_notification_failed',
        }
      );
    }
  }

  #assertConfigured() {
    const missing = ['baseUrl', 'apiSecret'].filter((field) => !this.config[field]);
    if (missing.length > 0) {
      throw new TypeError(`dan_ai notification configuration missing: ${missing.join(', ')}`);
    }
  }
}

module.exports = DanAiClient;
module.exports.DanAiNotificationClientError = DanAiNotificationClientError;
