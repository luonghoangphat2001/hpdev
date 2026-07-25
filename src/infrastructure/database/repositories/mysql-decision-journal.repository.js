'use strict';

class MysqlDecisionJournalRepository {
  constructor(executor) {
    this.executor = executor;
  }

  async create(entry) {
    await this.executor.execute(
      `INSERT INTO decision_journal (
         decision_id, workflow_id, goal_id, approval_id, actor_id,
         decision_type, decision, rationale, input_snapshot, input_hash,
         policy_version, expected_outcome, decided_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.decisionId,
        entry.workflowId,
        entry.goalId,
        entry.approvalId,
        entry.actorId,
        entry.decisionType,
        entry.decision,
        entry.rationale,
        JSON.stringify(entry.inputSnapshot),
        entry.inputHash,
        entry.policyVersion,
        entry.expectedOutcome ? JSON.stringify(entry.expectedOutcome) : null,
        entry.decidedAt,
      ],
    );
    return entry;
  }

  async recordOutcome(decisionId, outcome, status, reviewedAt) {
    const [result] = await this.executor.execute(
      `UPDATE decision_journal
       SET actual_outcome = ?, outcome_status = ?, reviewed_at = ?
       WHERE decision_id = ? AND outcome_status = 'pending'`,
      [JSON.stringify(outcome), status, reviewedAt, decisionId],
    );
    return result.affectedRows === 1;
  }
}

module.exports = MysqlDecisionJournalRepository;
