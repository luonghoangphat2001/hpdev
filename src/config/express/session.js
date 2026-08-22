'use strict';

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

function configureSession(app) {
  app.use(session(createSessionOptions()));
}

function createSessionOptions() {
  const sessionSecret = process.env.DASHBOARD_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === 'production') {
    throw new Error('DASHBOARD_SECRET must be configured in production');
  }

  const options = {
    secret: sessionSecret || 'development-only-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  if (process.env.DB_USER && process.env.DB_NAME) {
    options.store = new MySQLStore({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      createDatabaseTable: true,
      schema: { tableName: 'dashboard_sessions' },
    });
  }

  return options;
}

module.exports = configureSession;
module.exports.createSessionOptions = createSessionOptions;
