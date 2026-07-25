'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/error.middleware');

class DashboardRoute {
  constructor(controller) {
    this.router = express.Router();
    this.router.get('/overview', asyncHandler(controller.overview.bind(controller)));
    this.router.get('/agents', asyncHandler(controller.agents.bind(controller)));
    this.router.post(
      '/agents/:agentId/control',
      asyncHandler(controller.controlAgent.bind(controller)),
    );
    this.router.get('/workflows', asyncHandler(controller.workflows.bind(controller)));
  }
}

module.exports = DashboardRoute;
