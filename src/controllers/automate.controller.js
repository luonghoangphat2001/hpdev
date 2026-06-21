'use strict';

const BaseController = require('./base.controller');
const AutomateService = require('../services/automate.service');
const AutomateValidation = require('../validations/automate.validation');

class AutomateController extends BaseController {
  constructor(service = new AutomateService(), validation = new AutomateValidation()) {
    super();
    this.service = service;
    this.validation = validation;
  }

  async automate(req, res) {
    const payload = this.validation.validateAutomate(req.body);
    const result = await this.service.automate(payload);

    return this.ok(res, result);
  }
}

module.exports = AutomateController;
