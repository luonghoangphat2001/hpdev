'use strict';

const configureSettings = require('@bootstrap/express/settings');
const configureSecurity = require('@bootstrap/express/security');
const configureSession = require('@bootstrap/express/session');
const configureRequestMiddleware = require('@bootstrap/express/request');
const configureRequestMetadata = require('@bootstrap/express/metadata');
const mountRoutes = require('@bootstrap/express/routes');
const configureErrorHandlers = require('@bootstrap/express/errors');

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
