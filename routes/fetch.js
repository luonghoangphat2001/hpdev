'use strict';

const axios    = require('axios');
const pdfParse = require('pdf-parse');
const express  = require('express');
const router   = express.Router();

/**
 * POST /fetch
 * Body: { url: string, method?: string, headers?: object, data?: any }
 * Returns:
 *   PDF:  { status, type: 'pdf', text: string, pages: number }
 *   HTML: { status, type: 'html', headers, body }
 */
router.post('/', async (req, res) => {
  const { url, method = 'GET', headers = {}, data } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  const isPdfUrl = url.toLowerCase().includes('.pdf');

  try {
    const resp = await axios.request({
      url,
      method,
      headers,
      data,
      timeout:        15000,
      validateStatus: () => true,
      maxRedirects:   5,
      responseType:   isPdfUrl ? 'arraybuffer' : undefined,
    });

    const contentType = (resp.headers['content-type'] || '').toLowerCase();

    if (contentType.includes('application/pdf') || isPdfUrl) {
      try {
        const parsed = await pdfParse(Buffer.from(resp.data));
        return res.json({
          status: resp.status,
          type:   'pdf',
          text:   parsed.text.slice(0, 100000),
          pages:  parsed.numpages,
        });
      } catch (pdfErr) {
        return res.status(500).json({ error: `PDF parse failed: ${pdfErr.message}` });
      }
    }

    res.json({
      status:  resp.status,
      type:    'html',
      headers: resp.headers,
      body:    resp.data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
