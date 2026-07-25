'use strict';

class ExperimentFrameworkService {
  createExperimentProposal({ hypothesis, targetMetric, guardrailMetric, stopCondition }) {
    return Object.freeze({
      hypothesis,
      targetMetric,
      guardrailMetric,
      stopCondition,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    });
  }
}

module.exports = ExperimentFrameworkService;
