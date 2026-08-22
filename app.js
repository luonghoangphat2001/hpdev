'use strict';

/**
 * Dashboard entry point.
 * Infrastructure composition lives in src/config/application/.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('./src/utils/Logger').init();

const { startApplication } = require('./src/config/config');

startApplication().catch((err) => {
  console.error('Fatal error during application startup:', err);
  process.exit(1);
});
