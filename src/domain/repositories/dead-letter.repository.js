'use strict';

class DeadLetterRepository {
  async create(_deadLetter) {
    throw new Error('DeadLetterRepository.create must be implemented');
  }
}

module.exports = DeadLetterRepository;
