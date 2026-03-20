'use strict';

const axios   = require('axios');
const qs      = require('querystring');
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
    // DuckDuckGo HTML — dùng POST để nhận kết quả ổn định hơn
    const resp = await axios.post(
      'https://html.duckduckgo.com/html/',
      qs.stringify({ q: query, kl: 'vn-vi', b: '' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
          'Referer': 'https://html.duckduckgo.com/',
        },
        timeout: 15000,
      }
    );

    const html    = resp.data;
    const results = [];

    // Tìm tất cả link kết quả (result__a)
    const linkRe    = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    // Tìm snippet theo vị trí trong html sau mỗi link
    const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/span>/;

    let m;
    while ((m = linkRe.exec(html)) !== null && results.length < num) {
      let link    = m[1];
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      if (!title) continue;

      // DDG redirect URL → extract real URL
      if (link.includes('duckduckgo.com/l/?')) {
        const uddg = link.match(/uddg=([^&]+)/);
        if (uddg) link = decodeURIComponent(uddg[1]);
      }
      if (!link.startsWith('http')) continue;

      // Snippet: scan from current match position
      const after   = html.slice(m.index, m.index + 2000);
      const snipM   = snippetRe.exec(after);
      const snippet = snipM ? snipM[1].replace(/<[^>]+>/g, '').trim() : '';

      results.push({ title, link, snippet });
    }

    res.json({ results });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
