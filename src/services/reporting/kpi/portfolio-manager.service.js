/**
 * @fileoverview portfolio-manager.service - Provides portfolio-manager functionality.
 */
'use strict';

const PortfolioScoringPolicy = require('../../../policy/permissions/portfolio-scoring.policy');

/**
 * PortfolioManagerService
 * Manages portfolio manager logic.
 */
class PortfolioManagerService {
  constructor({
    transactionManager,
    workflowRepositoryFactory,
    scoringPolicy = new PortfolioScoringPolicy(),
  }) {
    this.transactionManager = transactionManager;
    this.workflowRepositoryFactory = workflowRepositoryFactory;
    this.scoringPolicy = scoringPolicy;
  }

  /**
   * rebalance - Asynchronously executes rebalance.
   * @param {*} capacityByAgent - Input parameter.
   * @param {*} limit - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async rebalance({ capacityByAgent = {}, limit = 200 } = {}) {
    return this.transactionManager.execute(async (connection) => {
      const repository = this.workflowRepositoryFactory(connection);
      const workflows = await repository.findPortfolioCandidates(limit);
      const ranked = workflows.map((workflow) => {
        const score = this.scoringPolicy.score(
          workflow,
          capacityByAgent[workflow.assigned_agent_id] || {},
        );
        return { workflow, ...score };
      }).sort((left, right) =>
        right.priority - left.priority
        || this.#deadline(left.workflow) - this.#deadline(right.workflow)
        || left.workflow.workflow_id.localeCompare(right.workflow.workflow_id));

      for (const item of ranked) {
        if (Number(item.workflow.priority) !== item.priority) {
          await repository.updatePriority(
            item.workflow.workflow_id,
            Number(item.workflow.state_version),
            item.priority,
          );
        }
      }
      return Object.freeze(ranked.map((item, index) => Object.freeze({
        rank: index + 1,
        workflowId: item.workflow.workflow_id,
        agentId: item.workflow.assigned_agent_id,
        priority: item.priority,
        factors: item.factors,
      })));
    });
  }

  #deadline(workflow) {
    const time = new Date(workflow.deadline_at || '9999-12-31').getTime();
    return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
  }
}

module.exports = PortfolioManagerService;
