'use strict';

const axios = require('axios');
const { AppError } = require('../middlewares/error.middleware');

class FetchService {
  constructor(httpClient = axios, pdfParser = null) {
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
        const parsed = await this.getPdfParser()(Buffer.from(resp.data));

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

  getPdfParser() {
    if (this.pdfParser) {
      return this.pdfParser;
    }

    try {
      this.pdfParser = require('pdf-parse');
      return this.pdfParser;
    } catch (err) {
      throw new AppError('pdf-parse is not installed. Run npm install before using PDF fetch.', 500);
    }
  }
}

module.exports = FetchService;
