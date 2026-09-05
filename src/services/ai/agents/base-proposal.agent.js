/**
 * @fileoverview base-proposal.agent - Provides base-proposal.agent functionality.
 */
'use strict';

const identifiers = require('@schemas/events/correlation');

/**
 * BaseProposalAgent
 * Manages base proposal agent logic.
 */
class BaseProposalAgent {
  constructor({
    agentId,
    proposalTypes,
    idFactory = identifiers,
    clock = () => new Date(),
  }) {
    this.agentId = agentId;
    this.proposalTypes = new Set(proposalTypes);
    this.idFactory = idFactory;
    this.clock = clock;
  }

  createProposal({
    workflowId,
    type,
    summary,
    evidence,
    recommendations,
    requestedActions = [],
  }) {
    if (!this.proposalTypes.has(type)) {
      throw new TypeError(`${this.agentId} cannot create proposal type: ${type}`);
    }

    return Object.freeze({
      schema_version: '1.0.0',
      proposal_id: this.idFactory.createId('proposal'),
      workflow_id: workflowId,
      agent_id: this.agentId,
      proposal_type: type,
      status: 'proposed',
      summary,
      evidence: Object.freeze(evidence),
      recommendations: Object.freeze(recommendations),
      requested_actions: Object.freeze(requestedActions),
      created_at: this.clock().toISOString(),
    });
  }
}

module.exports = BaseProposalAgent;
