'use strict';

const express = require('express');
const FetchController = require('../controllers/fetch.controller');
const { asyncHandler } = require('../middlewares/error.middleware');

class FetchRoute {
  constructor(controller = new FetchController()) {
    this.router = express.Router();
    this.controller = controller;
    this.register();
  }

  register() {
    this.router.post('/', asyncHandler(this.controller.fetch.bind(this.controller)));
  }
}

module.exports = new FetchRoute().router;
module.exports.FetchRoute = FetchRoute;
