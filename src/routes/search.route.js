'use strict';

const express = require('express');
const SearchController = require('../controllers/search.controller');
const { asyncHandler } = require('../middlewares/error.middleware');

class SearchRoute {
  constructor(controller = new SearchController()) {
    this.router = express.Router();
    this.controller = controller;
    this.register();
  }

  register() {
    this.router.post('/', asyncHandler(this.controller.search.bind(this.controller)));
  }
}

module.exports = new SearchRoute().router;
module.exports.SearchRoute = SearchRoute;
