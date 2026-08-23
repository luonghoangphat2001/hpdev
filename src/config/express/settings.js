'use strict';

function configureSettings(app) {
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
}

module.exports = configureSettings;
