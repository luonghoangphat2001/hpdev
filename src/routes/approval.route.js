'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/error.middleware');

class ApprovalRoute {
  constructor(controller) {
    this.router = express.Router();
    this.router.post(
      '/:approvalId/decision',
      asyncHandler(controller.decide.bind(controller)),
    );
  }
}

module.exports = ApprovalRoute;
