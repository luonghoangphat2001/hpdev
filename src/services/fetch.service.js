'use strict';

const axios = require('axios');
const pdfParse = require('pdf-parse');
const { AppError } = require('../middlewares/error.middleware');

class FetchService {
  constructor(httpClient = axios, pdfParser = pdfParse) {
    this.httpClient = httpClient;
    this.pdfParser = pdfParser;
  }

  async fetchUrl({ url, method = 'GET', headers = {}, data }) {
    const isPdfUrl = url.toLowerCase().includes('.pdf');
    const resp = await this.httpClient.request({
      url,
      method,
      headers,
      data,
      timeout: 15000,
      validateStatus: () => true,
      maxRedirects: 5,
      responseType: isPdfUrl ? 'arraybuffer' : undefined,
    });

    const contentType = (resp.headers['content-type'] || '').toLowerCase();

    if (contentType.includes('application/pdf') || isPdfUrl) {
      try {
        const parsed = await this.pdfParser(Buffer.from(resp.data));

        return {
          status: resp.status,
          type: 'pdf',
          text: parsed.text.slice(0, 100000),
          pages: parsed.numpages,
        };
      } catch (err) {
        throw new AppError(`PDF parse failed: ${err.message}`, 500);
      }
    }

    return {
      status: resp.status,
      type: 'html',
      headers: resp.headers,
      body: resp.data,
    };
  }
}

module.exports = FetchService;
