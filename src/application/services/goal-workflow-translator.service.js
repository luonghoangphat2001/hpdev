'use strict';

class GoalWorkflowTranslatorService {
  constructor({ goalRepository, planner }) {
    this.goalRepository = goalRepository;
    this.planner = planner;
  }

  async translate(goalId, {
    tokenBudget,
    timeoutMs,
  }) {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) throw new TypeError('Goal not found');
    if (['achieved', 'cancelled'].includes(goal.status)) {
      throw new TypeError(`Terminal goal cannot create workflow: ${goal.status}`);
    }
    const target = typeof goal.target === 'string' ? JSON.parse(goal.target) : goal.target;
    const objective = [
      goal.title,
      `Target ${target.metric} ${target.operator || 'equals'} ${target.value}`,
      `Deadline ${new Date(goal.deadline_at).toISOString()}`,
    ].join('. ');
    const plan = await this.planner.plan({
      workflowId: `goal:${goal.goal_id}:v${goal.version}`,
      objective,
      context: {
        goalId: goal.goal_id,
        parentGoalId: goal.parent_goal_id,
        horizon: goal.horizon,
        owner: { type: goal.owner_type, id: goal.owner_id },
        target,
        deadlineAt: new Date(goal.deadline_at).toISOString(),
      },
      tokenBudget,
      timeoutMs,
    });
    const milestones = [];
    const seen = new Set();
    plan.graph.list().forEach((task) => {
      if (!seen.has(task.milestone)) {
        seen.add(task.milestone);
        milestones.push(Object.freeze({
          name: task.milestone,
          taskIds: Object.freeze(plan.graph.list()
            .filter((candidate) => candidate.milestone === task.milestone)
            .map(({ id }) => id)),
        }));
      }
    });

    return Object.freeze({
      goalId: goal.goal_id,
      goalVersion: Number(goal.version),
      plan,
      milestones: Object.freeze(milestones),
    });
  }
}

module.exports = GoalWorkflowTranslatorService;
