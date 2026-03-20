'use strict';

require('dotenv').config();

const express = require('express');
const auth    = require('./middleware/auth');

const searchRouter   = require('./routes/search');
const fetchRouter    = require('./routes/fetch');
const crawlRouter    = require('./routes/crawl');
const automateRouter = require('./routes/automate');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '10mb' }));

// Health check (no auth)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// All API routes require Bearer token
app.use(auth);
app.use('/search',   searchRouter);
app.use('/fetch',    fetchRouter);
app.use('/crawl',    crawlRouter);
app.use('/automate', automateRouter);

app.listen(PORT, () => {
  console.log(`[OpenClaw] Listening on port ${PORT}`);
});
