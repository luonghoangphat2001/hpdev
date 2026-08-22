'use strict';

const createApiRouter = require('../../routes/api');
const createWebRouter = require('../../routes/web');

function mountRoutes(app, controllers) {
  app.use('/', createWebRouter(controllers.auth, controllers.web));
  app.use('/api', createApiRouter(controllers));
}

module.exports = mountRoutes;
