'use strict';

class MysqlOperatorControlRepository {
  constructor(executor) {
    this.executor = executor;
  }

  async findWorkflowForUpdate(workflowId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM workflows WHERE workflow_id = ? LIMIT 1 FOR UPDATE',
      [workflowId],
    );
    return rows[0] || null;
  }

  async changeState(workflowId, expectedVersion, {
    state,
    pausedFromState = null,
    completedAt = null,
  }) {
    const [result] = await this.executor.execute(
      `UPDATE workflows
       SET state = ?, paused_from_state = ?, state_version = state_version + 1,
           completed_at = ?
       WHERE workflow_id = ? AND state_version = ?`,
      [state, pausedFromState, completedAt, workflowId, expectedVersion],
    );
    return result.affectedRows === 1;
  }

  async saveFeedback(feedback) {
    await this.executor.execute(
      `INSERT INTO workflow_feedback
       (feedback_id, workflow_id, actor_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [
        feedback.feedbackId,
        feedback.workflowId,
        feedback.actorId,
        feedback.rating,
        feedback.comment,
      ],
    );
    return feedback;
  }
}

module.exports = MysqlOperatorControlRepository;
