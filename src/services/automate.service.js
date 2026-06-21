'use strict';

const { AppError } = require('../middlewares/error.middleware');

class AutomateService {
  constructor(browserEngine = null) {
    this.browserEngine = browserEngine;
  }

  async automate({ url, steps = [], screenshot = false }) {
    let browser;

    try {
      browser = await this.getBrowserEngine().launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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

  getBrowserEngine() {
    if (this.browserEngine) {
      return this.browserEngine;
    }

    try {
      this.browserEngine = require('playwright').chromium;
      return this.browserEngine;
    } catch (err) {
      throw new AppError('playwright is not installed. Run npm install before using browser automation.', 500);
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
