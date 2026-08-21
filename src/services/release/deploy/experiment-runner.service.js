/**
 * @fileoverview experiment-runner.service - Provides experiment-runner functionality.
 */
'use strict';

/**
 * ExperimentRunnerService
 * Manages experiment runner logic.
 */
class ExperimentRunnerService {
  /**
   * createExperimentProposal - Executes create experiment proposal.
   * @param {*} hypothesis - Input parameter.
   * @param {*} targetMetric - Input parameter.
   * @param {*} guardrailMetric - Input parameter.
   * @param {*} stopCondition - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = ExperimentRunnerService;
