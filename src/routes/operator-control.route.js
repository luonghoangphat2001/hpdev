'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/error.middleware');

class OperatorControlRoute {
  constructor(controller) {
    this.router = express.Router();
    this.router.post(
      '/workflows/:workflowId/control',
      asyncHandler(controller.control.bind(controller)),
    );
    this.router.post(
      '/workflows/:workflowId/feedback',
      asyncHandler(controller.feedback.bind(controller)),
    );
    this.router.post(
      '/events/:eventId/replay',
      asyncHandler(controller.replay.bind(controller)),
    );
  }
}

module.exports = OperatorControlRoute;
