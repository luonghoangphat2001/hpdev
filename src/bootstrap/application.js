'use strict';

const config = require('@config');
const createRepositories = require('@bootstrap/repositories');
const createServices = require('@bootstrap/services');
const seedAdmin = require('@bootstrap/admin');
const registerShutdownHandlers = require('@bootstrap/shutdown');
const Server = require('@server');

async function startApplication() {
  const repositories = await createRepositories();
  await seedAdmin(repositories);

  const services = await createServices(repositories);
  const server = new Server({
    ...repositories,
    ...services,
    ceoDashboardActorId: config.server.ceoDashboardActorId,
  }).start(config.server.port);

  registerShutdownHandlers(server);
  return server;
}

module.exports = startApplication;
