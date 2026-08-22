'use strict';

const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const AuthMiddleware = require('../middleware/AuthMiddleware');

const DIST_INDEX = path.join(__dirname, '../../../dist/index.html');

/**
 * Mount HTML page routes for Single-Page Application (SPA) & fallback MPA.
 *
 * @param {import('../controllers/AuthController')} authController
 * @param {import('../controllers/WebController')} webController
 * @returns {import('express').Router}
 */
function createWebRouter(authController, webController) {
  const router = Router();

  // If Vue 3 SPA build exists, serve it for web routes
  if (fs.existsSync(DIST_INDEX)) {
    const serveSpa = (_req, res) => res.sendFile(DIST_INDEX);

    router.post('/login', authController.login);
    router.post('/logout', authController.logout);

    router.get([
      '/',
      '/login',
      '/chat',
      '/learning',
      '/learning/*',
      '/tech',
      '/vocabulary',
      '/quiz',
      '/study',
      '/schedule',
      '/config',
      '/config/*',
      '/history',
      '/stats',
      '/users',
      '/openclaw',
      '/logs',
    ], serveSpa);

    return router;
  }

  // Fallback to legacy Multi-Page Application (MPA) views
  router.get('/', authController.showHome);
  router.get('/login', (req, res) => {
    if (req.session?.loggedIn) {
      return res.redirect(req.session.role === 'admin' ? '/admin' : '/chat');
    }
    return res.render('pages/login');
  });
  router.post('/login', authController.login);
  router.post('/logout', authController.logout);

  router.get('/admin', AuthMiddleware.adminWeb, (_req, res) => {
    return res.redirect('/config');
  });
  router.get('/dashboard', AuthMiddleware.user, (_req, res) => {
    return res.redirect('/chat');
  });
  router.get('/chat', AuthMiddleware.user, webController.chat);
  router.get('/learning', AuthMiddleware.user, webController.learning);
  router.get('/learning/*', AuthMiddleware.user, webController.learning);
  router.get('/tech', AuthMiddleware.user, webController.tech);
  router.get('/vocabulary', AuthMiddleware.user, webController.vocabulary);
  router.get('/quiz', AuthMiddleware.user, webController.quiz);
  router.get('/study', AuthMiddleware.user, webController.study);
  router.get('/schedule', AuthMiddleware.user, webController.study);

  router.get('/config', AuthMiddleware.adminWeb, webController.config);
  router.get('/config/*', AuthMiddleware.adminWeb, webController.config);
  router.get('/history', AuthMiddleware.adminWeb, webController.history);
  router.get('/stats', AuthMiddleware.adminWeb, webController.stats);
  router.get('/users', AuthMiddleware.adminWeb, webController.users);
  router.get('/openclaw', AuthMiddleware.adminWeb, webController.openclaw);
  router.get('/logs', AuthMiddleware.adminWeb, webController.logs);

  return router;
}

module.exports = createWebRouter;

