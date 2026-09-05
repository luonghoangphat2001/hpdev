'use strict';

const config = require('@config');

function configureSettings(app) {
  app.disable('x-powered-by');
  if (config.server.trustProxy) {
    app.set('trust proxy', 1);
  }
}

module.exports = configureSettings;
