/**
 * @fileoverview search.service - Provides search functionality.
 */
'use strict';

const axios = require('axios');
const env = require('../../../config/env');
const AppError = require('../../../utils/errors/app.error');

/**
 * SearchService
 * Manages search logic.
 */
class SearchService {
  /**
   * constructor - Executes constructor.
   * @param {*} httpClient - Input parameter.
   * @param {*} config - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(httpClient = axios, config = env) {
    if (httpClient && typeof httpClient === 'object' && !httpClient.request && typeof httpClient.get !== 'function') {
      this.config = httpClient;
      this.httpClient = axios;
    } else if (typeof httpClient === 'string') {
      this.config = { serperKey: httpClient };
      this.httpClient = axios;
    } else {
      this.httpClient = httpClient;
      this.config = typeof config === 'string' ? { serperKey: config } : (config || env);
    }
  }

  /**
   * search - Asynchronously executes search.
   * @param {*} query - Input parameter.
   * @param {*} num - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async search({ query, num = 5 }) {
    if (!this.config.serperKey) {
      throw new AppError('SERPER_KEY not configured', 500);
    }

    const limitedNum = Math.min(num, 50);
    const resp = await this.httpClient.request({
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://google.serper.dev/search',
      headers: {
        'X-API-KEY': this.config.serperKey,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ q: query, gl: 'vn', hl: 'vi', num: limitedNum }),
      timeout: 10000,
    });

    const results = (resp.data.organic || []).slice(0, limitedNum).map((item) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
    }));

    return { results };
  }
}

module.exports = SearchService;
