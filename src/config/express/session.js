'use strict';

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

function configureSession(app) {
  app.use(session(createSessionOptions()));
}

function createSessionOptions() {
  const sessionSecret = process.env.DASHBOARD_SECRET || process.env.SESSION_SECRET || 'dan-ai-secret-key-32-chars-long';

  const options = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
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
