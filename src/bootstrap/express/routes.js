'use strict';

const createApiRouter = require('@routes/api');

function mountRoutes(app, controllers) {
  app.use('/api', createApiRouter(controllers));
}

module.exports = mountRoutes;
