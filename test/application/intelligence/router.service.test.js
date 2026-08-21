'use strict';

const RouterService = require('../../../src/services/ai/router/router.service');
const JsonSchemaValidator = require('../../../src/utils/json-schema.validator');
const { buildCapabilityRegistry } = require('../../../src/services/ai/capabilities/capability-builder');

const outputSchema = Object.freeze({
  $id: 'https://openclaw.local/schemas/model-test-output-v1.json',
  type: 'object',
  additionalProperties: false,
  required: ['summary'],
  properties: {
    summary: { type: 'string', minLength: 1 },
  },
});

function build(handlers) {
  return new RouterService({
    capabilityRegistry: buildCapabilityRegistry(),
    modelHandlers: handlers,
    validator: new JsonSchemaValidator(),
  });
}

describe('RouterService', () => {
  test('selects a low-cost, low-latency model for routine work', () => {
    const router = build({
      fast: { generate: jest.fn() },
      balanced: { generate: jest.fn() },
      reasoning: { generate: jest.fn() },
    });

    expect(router.route({
      capability: 'summarization',
      maxCostTier: 'medium',
      maxLatencyTier: 'medium',
      riskLevel: 'low',
    }).map(({ id }) => id)).toEqual(['fast', 'balanced']);
  });

  test('prefers reasoning for high-risk planning then falls back with the same schema', async () => {
    const reasoning = {
      generate: jest.fn().mockRejectedValue(Object.assign(
        new Error('rate limited'),
        { code: 'model_rate_limited' }
      )),
    };
    const balanced = {
      generate: jest.fn().mockResolvedValue({ summary: 'Safe fallback result' }),
    };
    const router = build({ reasoning, balanced });

    await expect(router.execute({
      capability: 'planning',
      maxCostTier: 'high',
      maxLatencyTier: 'high',
      riskLevel: 'critical',
    }, {
      prompt: 'Plan a refund review',
      context: { workflowId: 'wfl_1' },
      outputSchema,
    })).resolves.toEqual({
      modelId: 'balanced',
      modelVersion: '1.0.0',
      outputSchemaId: outputSchema.$id,
      output: { summary: 'Safe fallback result' },
      fallbackCount: 1,
    });

    expect(reasoning.generate).toHaveBeenCalledWith(expect.objectContaining({ outputSchema }));
    expect(balanced.generate).toHaveBeenCalledWith(expect.objectContaining({ outputSchema }));
  });

  test('rejects invalid outputs and reports a sanitized exhausted fallback chain', async () => {
    const router = build({
      fast: { generate: jest.fn().mockResolvedValue({ wrong: 'shape' }) },
      balanced: { generate: jest.fn().mockRejectedValue(new Error('secret provider details')) },
    });

    await expect(router.execute({
      capability: 'summarization',
      maxCostTier: 'medium',
      maxLatencyTier: 'medium',
      riskLevel: 'low',
    }, {
      prompt: 'Summarize',
      context: {},
      outputSchema,
    })).rejects.toMatchObject({
      code: 'model_fallback_exhausted',
      attempts: [
        { modelId: 'fast', code: 'model_output_schema_invalid' },
        { modelId: 'balanced', code: 'model_generation_failed' },
      ],
    });
  });

  test('fails closed when budget constraints leave no eligible model', async () => {
    const router = build({
      reasoning: { generate: jest.fn() },
    });

    await expect(router.execute({
      capability: 'planning',
      maxCostTier: 'low',
      maxLatencyTier: 'low',
      riskLevel: 'critical',
    }, {
      prompt: 'Plan',
      context: {},
      outputSchema,
    })).rejects.toMatchObject({ code: 'model_route_unavailable' });
  });
});
