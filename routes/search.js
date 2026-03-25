'use strict';

const axios   = require('axios');
const express = require('express');
const router  = express.Router();

/**
 * POST /search
 * Body: { query: string, num?: number }
 * Returns: { results: [{ title, link, snippet }] }
 * Uses Serper.dev — 2500 free queries/month, no billing needed
 */
router.post('/', async (req, res) => {
  const { query, num = 5 } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const key = process.env.SERPER_KEY;
  if (!key) return res.status(500).json({ error: 'SERPER_KEY not configured' });

  try {
    const resp = await axios.request({
      method:        'post',
      maxBodyLength: Infinity,
      url:           'https://google.serper.dev/search',
      headers: {
        'X-API-KEY':    key,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ q: query, gl: 'vn', hl: 'vi', num: Math.min(num, 50) }),
      timeout: 10000,
    });

    const items = (resp.data.organic || []).slice(0, num).map((item) => ({
      title:   item.title   || '',
      link:    item.link    || '',
      snippet: item.snippet || '',
    }));

    res.json({ results: items });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
