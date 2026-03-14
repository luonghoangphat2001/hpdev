'use strict';

const express = require('express');
const session = require('express-session');
const path    = require('path');

const AuthController    = require('../controllers/AuthController');
const ChatController    = require('../controllers/ChatController');
const ConfigController  = require('../controllers/ConfigController');
const HistoryController = require('../controllers/HistoryController');
const LogController     = require('../controllers/LogController');
const ModelsController  = require('../controllers/ModelsController');
const StatsController   = require('../controllers/StatsController');
const UserController    = require('../controllers/UserController');
const createApiRouter   = require('../routes/api');
const createWebRouter   = require('../routes/web');

const VIEWS_DIR = path.join(__dirname, '../../dashboard/views');

/**
 * Express application wrapper.
 * Composes controllers, middleware, and routes via dependency injection.
 */
class DashboardServer {
  /** @type {import('express').Application} */
  #app;

  /**
   * @param {{
   *   aiService:        import('../services/AIService'),
   *   configRepo:       import('../models/ConfigRepository'),
   *   conversationRepo: import('../models/ConversationRepository'),
   *   userRepo:         import('../models/UserRepository'),
   * }} deps
   */
  constructor({ aiService, configRepo, conversationRepo, userRepo }) {
    this.#app = express();
    const controllers = this.#buildControllers({ aiService, configRepo, conversationRepo, userRepo });
    this.#configure(controllers, userRepo);
  }

  /**
   * Instantiate all controllers with their required dependencies.
   * @private
   */
  #buildControllers({ aiService, configRepo, conversationRepo, userRepo }) {
    return {
      auth:    new AuthController(userRepo),
      chat:    new ChatController(aiService),
      config:  new ConfigController(configRepo),
      history: new HistoryController(conversationRepo),
      log:     new LogController(),
      models:  new ModelsController(configRepo),
      stats:   new StatsController(conversationRepo),
      user:    new UserController(userRepo),
    };
  }

  /**
   * Attach global middleware and mount routers.
   * @private
   */
  #configure(controllers, userRepo) {
    const app = this.#app;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(VIEWS_DIR));
    app.use(session({
      secret:            process.env.DASHBOARD_SECRET || 'change-me-in-env',
      resave:            false,
      saveUninitialized: false,
      cookie:            { maxAge: 24 * 60 * 60 * 1000 },
    }));

    // Track last active time for every authenticated request
    app.use((req, _res, next) => {
      if (req.session?.loggedIn && req.session?.username) {
        userRepo.updateLastActive(req.session.username).catch(() => {});
      }
      next();
    });

    app.use('/',    createWebRouter(controllers.auth));
    app.use('/api', createApiRouter(controllers));
  }

  /** @param {number|string} port */
  start(port) {
    this.#app.listen(port, () => console.log(`Dashboard: http://localhost:${port}`));
  }
}

module.exports = DashboardServer;
