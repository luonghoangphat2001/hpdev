'use strict';

const APP_VERSION = require('./version');

function configureRequestMetadata(app, userRepo) {
  app.use((_req, res, next) => {
    res.setHeader('X-App-Version', APP_VERSION);
    next();
  });
  app.use((req, _res, next) => {
    if (req.session?.loggedIn && req.session?.username) {
      userRepo.updateLastActive(req.session.username).catch(() => {});
    }
    next();
  });
}

module.exports = configureRequestMetadata;
