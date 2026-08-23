'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

function configureRequestMiddleware(app) {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/api', createApiRateLimiter());
}

function createApiRateLimiter() {
  return rateLimit({
    windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    limit: Number(process.env.API_RATE_LIMIT_MAX || 300),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: shouldSkipApiRateLimit,
    message: { error: 'Too many requests, please try again later.' },
  });
}

function shouldSkipApiRateLimit(req) {
  return req.path === '/me' || req.path === '/health';
}

module.exports = configureRequestMiddleware;
module.exports.shouldSkipApiRateLimit = shouldSkipApiRateLimit;
