'use strict';

const express = require('express');
const AutomateController = require('../controllers/automate.controller');
const { asyncHandler } = require('../middlewares/error.middleware');

class AutomateRoute {
  constructor(controller = new AutomateController()) {
    this.router = express.Router();
    this.controller = controller;
    this.register();
  }

  register() {
    this.router.post('/', asyncHandler(this.controller.automate.bind(this.controller)));
  }
}

module.exports = new AutomateRoute().router;
module.exports.AutomateRoute = AutomateRoute;
