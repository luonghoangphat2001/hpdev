'use strict';

const EventIntakeValidation = require('../validations/event-intake.validation');

class EventIntakeController {
  constructor(service, validation = new EventIntakeValidation()) {
    this.service = service;
    this.validation = validation;
  }

  async create(req, res) {
    const command = this.validation.validate(req);
    const receipt = await this.service.accept(command);
    return res.status(202).json(receipt);
  }
}

module.exports = EventIntakeController;
