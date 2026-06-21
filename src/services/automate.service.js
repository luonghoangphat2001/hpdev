'use strict';

const { chromium } = require('playwright');

class AutomateService {
  constructor(browserEngine = chromium) {
    this.browserEngine = browserEngine;
  }

  async automate({ url, steps = [], screenshot = false }) {
    let browser;

    try {
      browser = await this.browserEngine.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      for (const step of steps) {
        await this.runStep(page, step);
      }

      const result = { url };
      if (screenshot) {
        const buf = await page.screenshot({ type: 'png' });
        result.screenshot = buf.toString('base64');
      }

      return result;
    } finally {
      if (browser) await browser.close();
    }
  }

  async runStep(page, step) {
    if (step.action === 'click' && step.selector) {
      await page.click(step.selector);
    }

    if (step.action === 'fill' && step.selector) {
      await page.fill(step.selector, step.value ?? '');
    }

    if (step.action === 'wait') {
      await page.waitForTimeout(step.ms ?? 1000);
    }
  }
}

module.exports = AutomateService;
