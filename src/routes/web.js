'use strict';

const { Router } = require('express');
const path = require('path');

const VIEWS_DIR = path.join(__dirname, '../../dashboard/views');

/**
 * Mount HTML page routes.
 *
 * @param {import('../controllers/AuthController')} authController
 * @returns {import('express').Router}
 */
function createWebRouter(authController) {
  const router = Router();

  // Public
  router.get('/',        authController.showHome);
  router.post('/login',  authController.login);
  router.post('/logout', authController.logout);

  // Admin dashboard — only accessible by admins
  router.get('/admin', (req, res) => {
    if (!req.session?.loggedIn)          return res.redirect('/');
    if (req.session.role !== 'admin')    return res.redirect('/');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(VIEWS_DIR, 'dashboard.html'));
  });

  // Legacy redirect — /dashboard → proper URL
  router.get('/dashboard', (req, res) => {
    if (!req.session?.loggedIn) return res.redirect('/');
    res.redirect(req.session.role === 'admin' ? '/admin' : '/');
  });

  return router;
}

module.exports = createWebRouter;
