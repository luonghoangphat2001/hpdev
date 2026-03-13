'use strict';

const { Router } = require('express');
const path = require('path');
const AuthMiddleware = require('../middleware/AuthMiddleware');

const VIEWS_DIR = path.join(__dirname, '../../dashboard/views');

/**
 * Mount HTML page routes.
 *
 * @param {import('../controllers/AuthController')} authController
 * @returns {import('express').Router}
 */
function createWebRouter(authController) {
  const router = Router();

  router.get('/',         authController.showLogin);
  router.post('/login',   authController.login);
  router.post('/logout',  authController.logout);

  router.get('/dashboard', AuthMiddleware.user, (_req, res) => {
    res.sendFile(path.join(VIEWS_DIR, 'dashboard.html'));
  });

  return router;
}

module.exports = createWebRouter;
