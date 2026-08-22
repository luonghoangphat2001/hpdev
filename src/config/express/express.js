'use strict';

const configureSettings = require('./settings');
const configureSecurity = require('./security');
const configureSession = require('./session');
const configureRequestMiddleware = require('./request');
const configureRequestMetadata = require('./metadata');
const mountRoutes = require('./routes');
const configureErrorHandlers = require('./errors');

function configureExpress(app, { controllers, userRepo }) {
  configureSettings(app);
  configureSecurity(app);
  configureRequestMiddleware(app);
  configureSession(app);
  configureRequestMetadata(app, userRepo);
  mountRoutes(app, controllers);
  configureErrorHandlers(app);
}

module.exports = configureExpress;
