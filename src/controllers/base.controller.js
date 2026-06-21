'use strict';

class BaseController {
  ok(res, data) {
    return res.json(data);
  }
}

module.exports = BaseController;
