/**
 * @fileoverview portfolio-scoring.policy - Provides portfolio-scoring functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

const RISK_SCORE = Object.freeze({
  low: 0.1,
  medium: 0.4,
  high: 0.75,
  critical: 1,
});

/**
 * PortfolioScoringPolicy
 * Manages portfolio scoring policy logic.
 */
class PortfolioScoringPolicy extends BasePolicy {
  constructor(options = {}) {
    super({ name: 'PortfolioScoringPolicy' });


  }
  /**
   * score - Executes score.
   * @param {*} workflow - Input parameter.
   * @param {*} capacity - Input parameter.
   * @returns {*} Result of operation.
   */
  score(workflow, capacity = {}) {
    const context = this.#context(workflow.input_context);
    const portfolio = context.portfolio || {};
    const urgency = this.#unit(portfolio.urgency);
    const impact = this.#unit(portfolio.impact);
    const goalAlignment = this.#unit(portfolio.goal_alignment);
    const cost = this.#unit(portfolio.cost);
    const risk = RISK_SCORE[workflow.risk_level] ?? 1;
    const max = Math.max(Number(capacity.maxConcurrency || 1), 1);
    const saturation = Math.min(
      1,
      (Number(capacity.active || 0) + Number(capacity.queueDepth || 0)) / max,
    );
    const capacityFit = 1 - saturation;
    const raw = (urgency * 0.3)
      + (impact * 0.3)
      + (risk * 0.15)
      + (goalAlignment * 0.15)
      + (capacityFit * 0.1)
      - (cost * 0.1);
    return Object.freeze({
      priority: Math.round(Math.min(1, Math.max(0, raw)) * 100),
      factors: Object.freeze({
        urgency,
        impact,
        risk,
        goalAlignment,
        cost,
        capacityFit,
      }),
    });
  }

  #unit(value) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number)) return 0;
    return Math.min(1, Math.max(0, number));
  }

  #context(value) {
    if (!value) return {};
    return typeof value === 'string' ? JSON.parse(value) : value;
  }
}

module.exports = PortfolioScoringPolicy;
