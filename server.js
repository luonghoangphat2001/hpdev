'use strict';

const Server = require('./src/server');

new Server().start().catch((error) => {
  console.error(`[OpenClaw] Startup failed: ${error.message}`);
  process.exitCode = 1;
});
