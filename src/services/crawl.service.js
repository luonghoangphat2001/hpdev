'use strict';

const axios = require('axios');
const { chromium } = require('playwright');

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-zygote',
  '--single-process',
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

class CrawlService {
  constructor(browserEngine = chromium, httpClient = axios) {
    this.browserEngine = browserEngine;
    this.httpClient = httpClient;
  }

  async crawl({ url }) {
    try {
      return await this.crawlWithBrowser(url);
    } catch (err) {
      console.warn(`[crawl] playwright failed (${err.message.split('\n')[0]}), falling back to axios`);
    }

    return this.crawlWithHttp(url);
  }

  async crawlWithBrowser(url) {
    let browser;

    try {
      browser = await this.browserEngine.launch({ args: BROWSER_ARGS });
      const page = await browser.newPage();

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.setExtraHTTPHeaders({
        'User-Agent': USER_AGENT,
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      });

      await page.goto(url, { waitUntil: 'load', timeout: 45000 });

      const title = await page.title();
      const html = await page.content();
      const text = await page.evaluate(() => document.body?.innerText?.trim() ?? '');

      return {
        url,
        title,
        text: text.slice(0, 50000),
        html: html.slice(0, 200000),
        engine: 'playwright',
      };
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  async crawlWithHttp(url) {
    const resp = await this.httpClient.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      },
      timeout: 30000,
      maxRedirects: 5,
    });
    const html = String(resp.data);
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    return {
      url,
      title,
      text: text.slice(0, 50000),
      html: html.slice(0, 200000),
      engine: 'axios',
    };
  }
}

module.exports = CrawlService;
