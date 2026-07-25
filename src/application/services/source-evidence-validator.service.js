'use strict';

class SourceEvidenceValidatorService {
  constructor({ maxAgeMinutes = 60 } = {}) {
    this.maxAgeMinutes = maxAgeMinutes;
  }

  validateEvidence({ evidenceRefs = [], sourceTimestamps = {} }) {
    if (evidenceRefs.length === 0) {
      return Object.freeze({
        isValid: false,
        reason: 'NO_EVIDENCE_PROVIDED',
      });
    }

    const now = Date.now();
    for (const ref of evidenceRefs) {
      const ts = sourceTimestamps[ref];
      if (!ts) {
        return Object.freeze({
          isValid: false,
          reason: `MISSING_TIMESTAMP_FOR_SOURCE:${ref}`,
        });
      }

      const ageMinutes = (now - new Date(ts).getTime()) / (1000 * 60);
      if (ageMinutes > this.maxAgeMinutes) {
        return Object.freeze({
          isValid: false,
          reason: `STALE_SOURCE:${ref}`,
          ageMinutes,
        });
      }
    }

    return Object.freeze({
      isValid: true,
      reason: null,
    });
  }
}

module.exports = SourceEvidenceValidatorService;
