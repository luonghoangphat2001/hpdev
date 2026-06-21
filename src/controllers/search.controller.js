'use strict';

const BaseController = require('./base.controller');
const SearchService = require('../services/search.service');
const SearchValidation = require('../validations/search.validation');

class SearchController extends BaseController {
  constructor(service = new SearchService(), validation = new SearchValidation()) {
    super();
    this.service = service;
    this.validation = validation;
  }

  async search(req, res) {
    const payload = this.validation.validateSearch(req.body);
    const result = await this.service.search(payload);

    return this.ok(res, result);
  }
}

module.exports = SearchController;
