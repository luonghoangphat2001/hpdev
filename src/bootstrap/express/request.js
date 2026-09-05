'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('@config');

function configureRequestMiddleware(app) {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/api', createApiRateLimiter());
}

function createApiRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
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
