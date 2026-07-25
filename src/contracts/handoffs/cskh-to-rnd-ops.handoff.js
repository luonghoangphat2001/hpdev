'use strict';

const { createCrossAgentHandoffDto } = require('../dto/cross-agent-handoff.dto');

function createCskhToRndOpsFeedbackHandoff({
  handoffId,
  workflowId,
  targetAgent, // 'dan_rnd' or 'dan_ops'
  complaintCategory,
  complaintCount = 1,
  details = '',
  deadlineAt,
}) {
  if (!targetAgent || !['dan_rnd', 'dan_ops'].includes(targetAgent)) {
    throw new Error('targetAgent must be either dan_rnd or dan_ops for CSKH feedback handoff');
  }
  if (!complaintCategory) {
    throw new Error('complaintCategory is required for CSKH feedback handoff');
  }

  const payload = {
    complaintCategory,
    complaintCount,
    details,
    feedbackProposal: {
      action: targetAgent === 'dan_rnd' ? 'adjust_recipe_quality' : 'review_prep_sop',
      recommendedTask: `Root cause analysis for ${complaintCategory} (occurred ${complaintCount} times)`,
    },
  };

  return createCrossAgentHandoffDto({
    handoffId,
    sourceAgent: 'dan_cskh',
    targetAgent,
    workflowId,
    contextRefs: [`complaint_category:${complaintCategory}`],
    payload,
    expectedResult: 'conduct_root_cause_analysis_and_propose_improvement',
    deadlineAt,
  });
}

module.exports = {
  createCskhToRndOpsFeedbackHandoff,
};
