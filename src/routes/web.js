/**
 * @fileoverview web - Provides web functionality.
 */
'use strict';

const { Router } = require('express');

/**
 * Mount basic web & health check routes.
 *
 * @returns {import('express').Router}
 */
function createWebRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/', (_req, res) => {
    res.json({ name: 'openclaw', status: 'running' });
  });

  return router;
}

module.exports = createWebRouter;
