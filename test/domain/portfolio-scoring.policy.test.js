'use strict';

const PortfolioScoringPolicy = require('../../src/domain/policies/portfolio-scoring.policy');

describe('PortfolioScoringPolicy', () => {
  test('raises priority for urgency, impact, risk, alignment and free capacity', () => {
    const policy = new PortfolioScoringPolicy();
    const high = policy.score({
      risk_level: 'high',
      input_context: {
        portfolio: {
          urgency: 1,
          impact: 0.9,
          goal_alignment: 1,
          cost: 0.2,
        },
      },
    }, { active: 1, queueDepth: 0, maxConcurrency: 5 });
    const low = policy.score({
      risk_level: 'low',
      input_context: JSON.stringify({
        portfolio: {
          urgency: 0.2,
          impact: 0.2,
          goal_alignment: 0.1,
          cost: 0.9,
        },
      }),
    }, { active: 5, queueDepth: 3, maxConcurrency: 5 });

    expect(high.priority).toBeGreaterThan(low.priority);
    expect(high.factors.capacityFit).toBe(0.8);
    expect(low.factors.capacityFit).toBe(0);
  });

  test('clamps malformed business scores into a safe 0..100 range', () => {
    const result = new PortfolioScoringPolicy().score({
      risk_level: 'unknown',
      input_context: { portfolio: { urgency: 99, impact: -5, cost: 'bad' } },
    });
    expect(result.priority).toBeGreaterThanOrEqual(0);
    expect(result.priority).toBeLessThanOrEqual(100);
  });
});
