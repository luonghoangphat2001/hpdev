'use strict';

const axios   = require('axios');
const express = require('express');
const router  = express.Router();

/**
 * POST /search
 * Body: { query: string, num?: number }
 * Returns: { results: [{ title, link, snippet }] }
 */
router.post('/', async (req, res) => {
  const { query, num = 5 } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  try {
    const resp = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query, kl: 'vn-vi' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    });

    const html = resp.data;
    const results = [];
    const blockRe   = /<div class="result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    const titleRe   = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/;
    const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/;
    let block;
    while ((block = blockRe.exec(html)) !== null && results.length < num) {
      const titleM   = titleRe.exec(block[1]);
      const snippetM = snippetRe.exec(block[1]);
      if (!titleM) continue;
      const link    = titleM[1].startsWith('http') ? titleM[1] : 'https://duckduckgo.com' + titleM[1];
      const title   = titleM[2].replace(/<[^>]+>/g, '').trim();
      const snippet = snippetM ? snippetM[1].replace(/<[^>]+>/g, '').trim() : '';
      if (title) results.push({ title, link, snippet });
    }

    res.json({ results });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
