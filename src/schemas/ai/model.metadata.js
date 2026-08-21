/**
 * @fileoverview model.metadata - Provides model.metadata functionality.
 */
'use strict';

function createModelDisclosureMetadata({
  model = 'gemini-3.6-flash',
  provider = 'google',
  promptVersion = 'v1.0',
  policyVersion = 'v1.0',
  toolsUsed = [],
}) {
  return Object.freeze({
    model,
    provider,
    promptVersion,
    policyVersion,
    toolsUsed: Object.freeze([...toolsUsed]),
    disclosedAt: new Date().toISOString(),
  });
}

module.exports = {
  createModelDisclosureMetadata,
};
