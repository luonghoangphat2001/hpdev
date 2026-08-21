/**
 * @fileoverview proposal-verifier.service - Provides proposal-verifier functionality.
 */
'use strict';

const crypto = require('crypto');
const ActionValidatorService = require('../../workflow/action/action-validator.service');
const RiskEvaluator = require('../../../policy/permissions/risk-evaluator');
const InvariantChecker = require('../../../policy/permissions/invariant-checker');
const agentRegistry = require('../../ai/agents/agent-registry');
const { stableSerialize } = require('../../../schemas/events/correlation');

/**
 * ProposalVerifierService
 * Manages proposal verifier logic.
 */
class ProposalVerifierService {
  constructor({
    agents = agentRegistry,
    actionValidator = new ActionValidatorService(),
    riskEvaluator = new RiskEvaluator(),
    invariantChecker = new InvariantChecker(),
    critic = null,
  } = {}) {
    this.agents = agents;
    this.actionValidator = actionValidator;
    this.riskEvaluator = riskEvaluator;
    this.invariantChecker = invariantChecker;
    this.critic = critic;
  }

  /**
   * verify - Asynchronously executes verify.
   * @param {*} proposal - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async verify(proposal) {
    const agent = this.#assertProposal(proposal);
    const decisions = [];
    for (const requestedAction of proposal.requested_actions) {
      if (!requestedAction?.action || !requestedAction?.payload) {
        throw this.#error('proposal_action_invalid');
      }
      if (!this.agents.routeAction(requestedAction.action).agents.includes(agent.id)) {
        throw this.#error('proposal_action_agent_mismatch');
      }
      this.actionValidator.validate(requestedAction.action, requestedAction.payload);
      this.invariantChecker.assert(proposal, requestedAction);
      const decision = this.riskEvaluator.evaluate({
        actionName: requestedAction.action,
        payload: requestedAction.payload,
        grantedPermissions: agent.permissions,
      });
      if (decision.decision === 'deny') throw this.#error(`risk_denied:${decision.reason}`);
      if (decision.decision === 'require_approval'
        && requestedAction.approval_required !== true) {
        throw this.#error('approval_flag_missing');
      }
      decisions.push(decision);
    }

    const requiresCritic = decisions.some(({ risk_level: risk }) =>
      risk === 'critical' || risk === 'high');
    if (requiresCritic && this.critic) {
      const review = await this.critic.review({ proposal, decisions });
      if (review?.approved !== true) throw this.#error('critic_rejected');
    }

    return Object.freeze({
      status: 'verified',
      proposalId: proposal.proposal_id,
      proposalHash: crypto.createHash('sha256')
        .update(stableSerialize(proposal))
        .digest('hex'),
      decisions: Object.freeze(decisions),
      criticApplied: Boolean(requiresCritic && this.critic),
    });
  }

  #assertProposal(proposal) {
    const required = [
      'schema_version', 'proposal_id', 'workflow_id', 'agent_id',
      'proposal_type', 'summary', 'evidence', 'recommendations',
      'requested_actions', 'created_at',
    ];
    if (!proposal || required.some((field) => proposal[field] === undefined)) {
      throw this.#error('proposal_schema_invalid');
    }
    if (proposal.schema_version !== '1.0.0' || proposal.status !== 'proposed') {
      throw this.#error('proposal_state_invalid');
    }
    if (!Array.isArray(proposal.evidence)
      || proposal.evidence.some((evidence) => !evidence?.source_ref)) {
      throw this.#error('proposal_evidence_invalid');
    }
    const agent = this.agents.get(proposal.agent_id);
    if (!agent) throw this.#error('proposal_agent_unknown');
    return agent;
  }

  #error(code) {
    const error = new Error('Proposal verification failed');
    error.code = code;
    return error;
  }
}

module.exports = ProposalVerifierService;
