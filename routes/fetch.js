'use strict';

const axios   = require('axios');
const express = require('express');
const router  = express.Router();

/**
 * POST /fetch
 * Body: { url: string, method?: string, headers?: object, data?: any }
 * Returns: { status, headers, body }
 */
router.post('/', async (req, res) => {
  const { url, method = 'GET', headers = {}, data } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const resp = await axios.request({
      url,
      method,
      headers,
      data,
      timeout:         15000,
      validateStatus:  () => true,  // don't throw on 4xx/5xx
      maxRedirects:    5,
    });

    res.json({
      status:  resp.status,
      headers: resp.headers,
      body:    resp.data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
