'use strict';

const axios = require('axios');
const env = require('../config/env');
const { AppError } = require('../middlewares/error.middleware');

class SearchService {
  constructor(httpClient = axios, config = env) {
    this.httpClient = httpClient;
    this.config = config;
  }

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
