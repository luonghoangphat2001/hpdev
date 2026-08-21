/**
 * @fileoverview second-pass.service - Provides second-pass functionality.
 */
'use strict';

/**
 * SecondPassService
 * Manages second pass logic.
 */
class SecondPassService {
  /**
   * reviewProposal - Asynchronously executes review proposal.
   * @param {*} proposal - Input parameter.
   * @param {*} riskLevel - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async reviewProposal({ proposal, riskLevel = 'LOW' }) {
    if (riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL') {
      return Object.freeze({
        approvedByCritic: true,
        criticNotes: 'Skipped for LOW/MEDIUM risk',
      });
    }

    const hasActionPayload = proposal && Array.isArray(proposal.proposed_actions) && proposal.proposed_actions.length > 0;
    if (!hasActionPayload) {
      return Object.freeze({
        approvedByCritic: false,
        criticNotes: 'High risk proposal contains no executable actions',
      });
    }

    return Object.freeze({
      approvedByCritic: true,
      criticNotes: 'Second-pass critic passed validation',
      reviewedAt: new Date().toISOString(),
    });
  }
}

module.exports = SecondPassService;
