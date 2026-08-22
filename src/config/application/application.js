'use strict';

const createRepositories = require('./repositories');
const createServices = require('./services');
const seedAdmin = require('./admin');
const registerShutdownHandlers = require('./shutdown');

async function startApplication() {
  // Load after config.js has finished exporting to avoid a config ↔ server cycle.
  const Server = require('../../server');
  const repositories = await createRepositories();
  await seedAdmin(repositories);

  const services = await createServices(repositories);
  const port = process.env.PORT || process.env.DASHBOARD_PORT || 3000;
  const server = new Server({
    ...repositories,
    ...services,
    ceoDashboardActorId: process.env.CEO_DASHBOARD_ACTOR_ID || null,
  }).start(port);

  registerShutdownHandlers(server);
  return server;
}

module.exports = startApplication;
