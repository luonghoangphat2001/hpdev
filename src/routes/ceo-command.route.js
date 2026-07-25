'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/error.middleware');

class CeoCommandRoute {
  constructor(controller) {
    this.router = express.Router();
    this.router.post(
      '/:commandName',
      asyncHandler(controller.execute.bind(controller)),
    );
  }
}

module.exports = CeoCommandRoute;
