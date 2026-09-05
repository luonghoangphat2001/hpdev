/**
 * @fileoverview fetch.service - Provides fetch functionality.
 */
'use strict';

const axios = require('axios');
const AppError = require('@utils/errors/app.error');

/**
 * FetchService
 * Manages fetch logic.
 */
class FetchService {
  /**
   * constructor - Executes constructor.
   * @param {*} httpClient - Input parameter.
   * @param {*} pdfParser - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(httpClient = axios, pdfParser = null) {
    this.httpClient = httpClient;
    this.pdfParser = pdfParser;
  }

  /**
   * fetchUrl - Asynchronously executes fetch url.
   * @param {*} url - Input parameter.
   * @param {*} method - Input parameter.
   * @param {*} headers - Input parameter.
   * @param {*} data - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * getPdfParser - Executes get pdf parser.
   * @returns {*} Result of operation.
   */
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
