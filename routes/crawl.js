'use strict';

const { chromium } = require('playwright');
const axios        = require('axios');
const express      = require('express');
const router       = express.Router();

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-zygote',
  '--single-process',
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * POST /crawl
 * Body: { url: string }
 * Returns: { url, title, text, html, engine: 'playwright'|'axios' }
 */
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  // Try Playwright first (full JS rendering)
  let browser;
  try {
    browser = await chromium.launch({ args: BROWSER_ARGS });
    const page = await browser.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({
      'User-Agent':      USER_AGENT,
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    });

    await page.goto(url, { waitUntil: 'load', timeout: 45000 });

    const title = await page.title();
    const html  = await page.content();
    const text  = await page.evaluate(() => document.body?.innerText?.trim() ?? '');

    return res.json({ url, title, text: text.slice(0, 50000), html: html.slice(0, 200000), engine: 'playwright' });
  } catch (playwrightErr) {
    console.warn(`[crawl] playwright failed (${playwrightErr.message.split('\n')[0]}), falling back to axios`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  // Fallback: axios plain HTTP fetch
  try {
    const resp = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8' },
      timeout: 30000,
      maxRedirects: 5,
    });
    const html = String(resp.data);
    // Strip tags for plain text
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    return res.json({ url, title, text: text.slice(0, 50000), html: html.slice(0, 200000), engine: 'axios' });
  } catch (axiosErr) {
    return res.status(500).json({ error: axiosErr.message });
  }
});

module.exports = router;
