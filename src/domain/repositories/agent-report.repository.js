'use strict';

class AgentReportRepository {
  async summarizeAgent(_agentId, _from, _to) {
    throw new Error('AgentReportRepository.summarizeAgent must be implemented');
  }
}

module.exports = AgentReportRepository;
