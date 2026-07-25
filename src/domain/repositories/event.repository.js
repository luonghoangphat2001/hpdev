'use strict';

class EventRepository {
  async create(_event) {
    throw new Error('EventRepository.create must be implemented');
  }

  async findByEventId(_eventId) {
    throw new Error('EventRepository.findByEventId must be implemented');
  }

  async updateStatus(_eventId, _status, _failure = null) {
    throw new Error('EventRepository.updateStatus must be implemented');
  }
}

module.exports = EventRepository;
