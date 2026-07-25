'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/error.middleware');

class EventIntakeRoute {
  constructor({ controller, verificationMiddleware }) {
    if (!controller || !verificationMiddleware) {
      throw new TypeError('Event intake controller and verification middleware are required');
    }

    this.router = express.Router();
    this.controller = controller;
    this.verificationMiddleware = verificationMiddleware;
    this.register();
  }

  register() {
    this.router.post(
      '/',
      this.verificationMiddleware,
      asyncHandler(this.controller.create.bind(this.controller)),
    );
  }
}

module.exports = EventIntakeRoute;
