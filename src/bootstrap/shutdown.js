'use strict';

function registerShutdownHandlers(server) {
  const shutdown = (signal) => {
    console.log(`[DashboardServer] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

module.exports = registerShutdownHandlers;
