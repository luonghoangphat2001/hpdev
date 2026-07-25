'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/error.middleware');

class CeoExceptionRoute {
  constructor(controller) {
    this.router = express.Router();
    this.router.get('/', asyncHandler(controller.list.bind(controller)));
    this.router.post('/refresh', asyncHandler(controller.refresh.bind(controller)));
    this.router.post(
      '/:exceptionId/acknowledge',
      asyncHandler(controller.acknowledge.bind(controller)),
    );
  }
}

module.exports = CeoExceptionRoute;
