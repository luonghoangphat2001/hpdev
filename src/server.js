'use strict';

const express = require('express');
const buildControllers = require('@controllers/container');
const configureExpress = require('@bootstrap/express');

/**
 * Express application wrapper.
 * Construction is separated from listen() so tests and Passenger can reuse it.
 */
class Server {
  /** @type {import('express').Application} */
  #app;

  /**
   * @param {Record<string, any>} dependencies
   */
  constructor(dependencies) {
    this.#app = express();
    const controllers = buildControllers(dependencies);
    configureExpress(this.#app, {
      controllers,
      userRepo: dependencies.userRepo,
    });
  }

  /**
   * Start listening on the specified port.
   * @param {number|string} port
   * @returns {import('http').Server}
   */
  start(port) {
    return this.#app.listen(port, () => {
      console.log(`[DashboardServer] running on port ${port}`);
    });
  }

  /** @returns {import('express').Application} */
  getApp() {
    return this.#app;
  }
}

module.exports = Server;
