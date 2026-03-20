'use strict';

const { chromium } = require('playwright');
const express      = require('express');
const router       = express.Router();

/**
 * POST /automate
 * Body: {
 *   url: string,
 *   steps: [
 *     { action: 'click'|'fill'|'wait', selector?: string, value?: string, ms?: number }
 *   ],
 *   screenshot?: boolean
 * }
 * Returns: { url, screenshot?: string (base64 PNG) }
 */
router.post('/', async (req, res) => {
  const { url, steps = [], screenshot = false } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    for (const step of steps) {
      if (step.action === 'click'  && step.selector) await page.click(step.selector);
      if (step.action === 'fill'   && step.selector) await page.fill(step.selector, step.value ?? '');
      if (step.action === 'wait')                    await page.waitForTimeout(step.ms ?? 1000);
    }

    const result = { url };
    if (screenshot) {
      const buf = await page.screenshot({ type: 'png' });
      result.screenshot = buf.toString('base64');
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;
