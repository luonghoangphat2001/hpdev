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

  const cx  = process.env.GOOGLE_CX;
  const key = process.env.GOOGLE_KEY;
  if (!cx || !key) return res.status(500).json({ error: 'Google Search not configured' });

  try {
    const url = 'https://www.googleapis.com/customsearch/v1';
    const resp = await axios.get(url, {
      params: { key, cx, q: query, num: Math.min(num, 10) },
      timeout: 10000,
    });

    const items = (resp.data.items || []).map((item) => ({
      title:   item.title,
      link:    item.link,
      snippet: item.snippet,
    }));

    res.json({ results: items });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
