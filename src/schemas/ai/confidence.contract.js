/**
 * @fileoverview confidence.contract - Provides confidence.contract functionality.
 */
'use strict';

function createOutputConfidenceContract({
  conclusion,
  confidenceScore = 0.5,
  evidenceRefs = [],
  uncertaintyNotes = [],
}) {
  if (!conclusion) {
    throw new Error('conclusion is required for OutputConfidenceContract');
  }

  const score = Math.max(0, Math.min(1.0, confidenceScore));

  return Object.freeze({
    conclusion,
    confidenceScore: score,
    isHighConfidence: score >= 0.8,
    evidenceRefs: Object.freeze([...evidenceRefs]),
    uncertaintyNotes: Object.freeze([...uncertaintyNotes]),
    evaluatedAt: new Date().toISOString(),
  });
}

module.exports = {
  createOutputConfidenceContract,
};
