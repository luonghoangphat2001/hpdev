/**
 * @fileoverview router.service - Provides router functionality.
 */
'use strict';

const TIER = Object.freeze({ low: 1, medium: 2, high: 3 });
const RISK = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });

/**
 * RouterService
 * Manages router logic.
 */
class RouterService {
  constructor({
    capabilityRegistry,
    modelHandlers,
    validator,
  }) {
    this.capabilityRegistry = capabilityRegistry;
    this.modelHandlers = modelHandlers;
    this.validator = validator;
  }

  route({
    capability,
    maxCostTier = 'high',
    maxLatencyTier = 'high',
    riskLevel = 'low',
  }) {
    if (!capability || !TIER[maxCostTier] || !TIER[maxLatencyTier] || !RISK[riskLevel]) {
      throw new TypeError('Invalid model routing request');
    }
    const candidates = this.capabilityRegistry.query({
      kind: 'model',
      capability,
      available: true,
    }).filter((model) =>
      TIER[model.metadata.costTier] <= TIER[maxCostTier]
      && TIER[model.metadata.latencyTier] <= TIER[maxLatencyTier]
      && this.modelHandlers[model.id]);

    const targetTier = RISK[riskLevel] >= RISK.high ? TIER.high : TIER.low;
    return candidates.sort((left, right) => {
      const leftDistance = Math.abs(TIER[left.metadata.costTier] - targetTier);
      const rightDistance = Math.abs(TIER[right.metadata.costTier] - targetTier);
      return leftDistance - rightDistance
        || TIER[left.metadata.latencyTier] - TIER[right.metadata.latencyTier];
    });
  }

  async execute(request, {
    prompt,
    context,
    outputSchema,
  }) {
    if (!outputSchema?.$id) throw new TypeError('A versioned outputSchema is required');
    const candidates = this.route(request);
    if (candidates.length === 0) {
      throw new ModelRoutingError('No model satisfies routing constraints', {
        code: 'model_route_unavailable',
        attempts: [],
      });
    }
    const attempts = [];
    for (const model of candidates) {
      try {
        const output = await this.modelHandlers[model.id].generate({
          prompt,
          context,
          outputSchema,
        });
        const validation = this.validator.validate(outputSchema, output);
        if (!validation.valid) {
          attempts.push({
            modelId: model.id,
            code: 'model_output_schema_invalid',
          });
          continue;
        }
        return Object.freeze({
          modelId: model.id,
          modelVersion: model.version,
          outputSchemaId: outputSchema.$id,
          output,
          fallbackCount: attempts.length,
        });
      } catch (error) {
        attempts.push({
          modelId: model.id,
          code: error.code || 'model_generation_failed',
        });
      }
    }
    throw new ModelRoutingError('All model candidates failed', {
      code: 'model_fallback_exhausted',
      attempts,
    });
  }
}

/**
 * ModelRoutingError
 * Manages model routing error logic.
 */
class ModelRoutingError extends Error {
  /**
   * constructor - Executes constructor.
   * @param {*} message - Input parameter.
   * @param {*} code - Input parameter.
   * @param {*} attempts - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(message, { code, attempts }) {
    super(message);
    this.name = 'ModelRoutingError';
    this.code = code;
    this.attempts = Object.freeze(attempts.map((attempt) => Object.freeze(attempt)));
  }
}

module.exports = RouterService;
module.exports.ModelRoutingError = ModelRoutingError;
module.exports.TIER = TIER;
