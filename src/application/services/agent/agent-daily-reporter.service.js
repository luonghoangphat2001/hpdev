'use strict';

class AgentDailyReporterService {
  constructor({ agent, reportRepository }) {
    this.agent = agent;
    this.reportRepository = reportRepository;
  }

  async report({ from, to }) {
    const metrics = await this.reportRepository.summarizeAgent(
      this.agent.id,
      from,
      to,
    );
    return Object.freeze({
      agentId: this.agent.id,
      department: this.agent.department,
      status: metrics.failedCount > 0 ? 'attention' : 'ok',
      metrics,
    });
  }
}

module.exports = AgentDailyReporterService;
