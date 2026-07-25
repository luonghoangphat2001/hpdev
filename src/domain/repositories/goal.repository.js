'use strict';

class GoalRepository {
  async create(_goal) {
    throw new Error('GoalRepository.create must be implemented');
  }

  async findById(_goalId) {
    throw new Error('GoalRepository.findById must be implemented');
  }

  async update(_goal, _expectedVersion) {
    throw new Error('GoalRepository.update must be implemented');
  }
}

module.exports = GoalRepository;
