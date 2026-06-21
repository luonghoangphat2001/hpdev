'use strict';

const BaseController = require('./base.controller');
const FetchService = require('../services/fetch.service');
const FetchValidation = require('../validations/fetch.validation');

class FetchController extends BaseController {
  constructor(service = new FetchService(), validation = new FetchValidation()) {
    super();
    this.service = service;
    this.validation = validation;
  }

  async fetch(req, res) {
    const payload = this.validation.validateFetch(req.body);
    const result = await this.service.fetchUrl(payload);

    return this.ok(res, result);
  }
}

module.exports = FetchController;
