'use strict';

const startApplication = require('./application/application');
const configureExpress = require('./express/express');
const buildControllers = require('./controllers/controllers');
const APP_VERSION = require('./express/version');
const schemas = require('./schemas/schemas');

/**
 * Public entry point for application configuration.
 *
 * Code outside src/config should import configuration through this facade.
 * Config modules may import each other directly to keep dependencies explicit
 * and avoid circular references.
 */
module.exports = {
  startApplication,
  configureExpress,
  buildControllers,
  APP_VERSION,
  ...schemas,
};
