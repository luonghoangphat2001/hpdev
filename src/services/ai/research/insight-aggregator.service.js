/**
 * @fileoverview insight-aggregator.service - Provides insight-aggregator functionality.
 */
'use strict';

/**
 * InsightAggregatorService
 * Manages insight aggregator logic.
 */
class InsightAggregatorService {
  /**
   * constructor - Executes constructor.
   * @param {*} piiRedactorService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ piiRedactorService }) {
    this.piiRedactorService = piiRedactorService;
  }

  /**
   * aggregateInsights - Executes aggregate insights.
   * @param {*} reviews - Input parameter.
   * @param {*} tickets - Input parameter.
   * @returns {*} Result of operation.
   */
  aggregateInsights({ reviews = [], tickets = [] }) {
    const rawText = [...reviews.map(r => r.comment || ''), ...tickets.map(t => t.description || '')].join('\n');
    const redactedText = this.piiRedactorService ? this.piiRedactorService.redactText(rawText) : rawText;

    return Object.freeze({
      totalCount: reviews.length + tickets.length,
      summary: redactedText,
      evidenceRefs: [...reviews.map(r => `review:${r.id}`), ...tickets.map(t => `ticket:${t.id}`)],
      aggregatedAt: new Date().toISOString(),
    });
  }
}

module.exports = InsightAggregatorService;
