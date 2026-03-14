'use strict';

const { Router } = require('express');
const AuthMiddleware = require('../middleware/AuthMiddleware');

/**
 * Mount all /api/* routes.
 *
 * @param {{
 *   auth:    import('../controllers/AuthController'),
 *   chat:    import('../controllers/ChatController'),
 *   config:  import('../controllers/ConfigController'),
 *   history: import('../controllers/HistoryController'),
 *   stats:   import('../controllers/StatsController'),
 *   user:    import('../controllers/UserController'),
 *   log:     import('../controllers/LogController'),
 * }} controllers
 * @returns {import('express').Router}
 */
function createApiRouter(controllers) {
  const router = Router();
  const { user: authUser, admin: authAdmin } = AuthMiddleware;

  // ─── Public health check (no auth) ───────────────────
  router.get('/health', (_req, res) => res.json({ ok: true }));

  // ─── Any authenticated user ───────────────────────────
  router.get('/me',       authUser, controllers.auth.getMe);
  router.post('/chat',    authUser, controllers.chat.handle);
  router.post('/password', authUser, controllers.user.changePassword);

  // ─── Admin only ───────────────────────────────────────
  router.get('/config',    authAdmin, controllers.config.get);
  router.post('/config',   authAdmin, controllers.config.update);

  router.get('/models/:provider', authAdmin, controllers.models.list);

  router.get('/history',   authAdmin, controllers.history.get);
  router.get('/stats',     authAdmin, controllers.stats.get);

  router.get('/users',             authAdmin, controllers.user.list);
  router.post('/users',            authAdmin, controllers.user.create);
  router.delete('/users/:username', authAdmin, controllers.user.remove);

  router.get('/logs',           authAdmin, controllers.log.list);
  router.get('/logs/:filename', authAdmin, controllers.log.download);

  return router;
}

module.exports = createApiRouter;
