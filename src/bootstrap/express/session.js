'use strict';

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const config = require('@config');

function configureSession(app) {
  app.use(session(createSessionOptions()));
}

function createSessionOptions() {
  const options = {
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.session.cookieSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  if (config.database.user && config.database.database) {
    options.store = new MySQLStore({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      createDatabaseTable: true,
      schema: { tableName: 'dashboard_sessions' },
    });
  }

  return options;
}

module.exports = configureSession;
module.exports.createSessionOptions = createSessionOptions;
