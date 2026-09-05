'use strict';

/**
 * Dashboard entry point.
 * Centralized bootstrap with module aliases and clean lifecycle management.
 */
require('module-alias/register');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('@utils/Logger').init();

const startApplication = require('@bootstrap/application');

startApplication().catch((err) => {
  console.error('[StartupError]', err.message);
  process.exit(1);
});
