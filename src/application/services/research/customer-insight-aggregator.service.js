'use strict';

class CustomerInsightAggregatorService {
  constructor({ piiRedactorService }) {
    this.piiRedactorService = piiRedactorService;
  }

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

module.exports = CustomerInsightAggregatorService;
