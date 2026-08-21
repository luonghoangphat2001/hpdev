'use strict';

const ProposalVerifierService = require('../../../src/services/reporting/daily/proposal-verifier.service');

function proposal(patch = {}) {
  return {
    schema_version: '1.0.0',
    proposal_id: 'prp_1',
    workflow_id: 'wfl_1',
    agent_id: 'dan_cfo',
    proposal_type: 'refund',
    status: 'proposed',
    summary: 'Refund proposal',
    evidence: [{
      source_ref: 'order:10',
      refundable_amount: 500000,
    }],
    recommendations: [{ recommendation: 'review_refund' }],
    requested_actions: [{
      action: 'finance.refund.execute',
      payload: { order_id: 10, amount: 200000, reason: 'Customer request' },
      approval_required: true,
    }],
    created_at: '2026-07-25T08:00:00.000Z',
    ...patch,
  };
}

describe('ProposalVerifierService', () => {
  test('verifies schema, ownership, policy, invariant and high-risk critic', async () => {
    const critic = { review: jest.fn().mockResolvedValue({ approved: true }) };
    const verifier = new ProposalVerifierService({ critic });

    await expect(verifier.verify(proposal())).resolves.toMatchObject({
      status: 'verified',
      proposalId: 'prp_1',
      proposalHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      decisions: [{
        decision: 'require_approval',
        action: 'finance.refund.execute',
        risk_level: 'critical',
      }],
      criticApplied: true,
    });
    expect(critic.review).toHaveBeenCalledTimes(1);
  });

  test('blocks an action that does not belong to the proposing agent', async () => {
    const verifier = new ProposalVerifierService();
    await expect(verifier.verify(proposal({
      agent_id: 'dan_rnd',
    }))).rejects.toMatchObject({ code: 'proposal_action_agent_mismatch' });
  });

  test('blocks missing approvals and business evidence mismatches', async () => {
    const verifier = new ProposalVerifierService();
    const withoutApproval = proposal({
      requested_actions: [{
        action: 'finance.refund.execute',
        payload: { order_id: 10, amount: 200000, reason: 'Customer request' },
      }],
    });
    await expect(verifier.verify(withoutApproval))
      .rejects.toMatchObject({ code: 'approval_flag_missing' });

    const excessiveRefund = proposal({
      requested_actions: [{
        action: 'finance.refund.execute',
        payload: { order_id: 10, amount: 600000, reason: 'Customer request' },
        approval_required: true,
      }],
    });
    await expect(verifier.verify(excessiveRefund))
      .rejects.toMatchObject({ code: 'refund_amount_exceeds_evidence' });
  });

  test('fails closed when the second-pass critic rejects critical risk', async () => {
    const critic = { review: jest.fn().mockResolvedValue({
      approved: false,
      reason: 'insufficient evidence',
    }) };
    const verifier = new ProposalVerifierService({ critic });

    await expect(verifier.verify(proposal()))
      .rejects.toMatchObject({ code: 'critic_rejected' });
  });
});
