'use strict';

class SopExecutionEngine {
  constructor({ sopRepository }) {
    this.sopRepository = sopRepository;
  }

  async executeSop({ sopId, version, initialContext = {} }) {
    let sopVersion;
    if (version) {
      sopVersion = await this.sopRepository.findVersionForUpdate(sopId, version);
    } else {
      const playbook = await this.sopRepository.findPlaybookById?.(sopId);
      if (!playbook || !playbook.active_version) {
        throw new Error(`Active SOP playbook not found: ${sopId}`);
      }
      sopVersion = await this.sopRepository.findVersionForUpdate(sopId, playbook.active_version);
    }

    if (!sopVersion) {
      throw new Error(`SOP version not found: ${sopId} v${version}`);
    }

    const definition = typeof sopVersion.definition === 'string'
      ? JSON.parse(sopVersion.definition)
      : sopVersion.definition;

    const steps = definition.steps || [];
    const executionResults = [];
    const context = { ...initialContext };

    for (const step of steps) {
      // Check preconditions
      const preconditionsMet = (step.preconditions || []).every(cond => !!context[cond]);
      if (!preconditionsMet) {
        executionResults.push({
          stepId: step.id,
          name: step.name,
          status: 'BLOCKED_PRECONDITION_FAILED',
        });
        break;
      }

      executionResults.push({
        stepId: step.id,
        name: step.name,
        status: 'COMPLETED',
        output: step.expectedOutput || {},
      });
      Object.assign(context, step.expectedOutput || {});
    }

    return Object.freeze({
      sopId,
      version: sopVersion.version,
      status: executionResults.every(r => r.status === 'COMPLETED') ? 'COMPLETED' : 'INCOMPLETE',
      steps: executionResults,
      finalContext: context,
    });
  }
}

module.exports = SopExecutionEngine;
