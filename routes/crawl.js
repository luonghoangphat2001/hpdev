'use strict';

const { chromium } = require('playwright');
const express      = require('express');
const router       = express.Router();

/**
 * POST /crawl
 * Body: { url: string }
 * Returns: { url, title, text, html }
 */
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page  = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const title = await page.title();
    const html  = await page.content();
    // Extract visible text from body
    const text  = await page.evaluate(() => document.body?.innerText?.trim() ?? '');

    res.json({ url, title, text: text.slice(0, 50000), html: html.slice(0, 200000) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;
