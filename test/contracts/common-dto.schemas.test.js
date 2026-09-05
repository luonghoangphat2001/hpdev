'use strict';

const registry = require('@schemas/ai/registry');
const { ContractRegistry } = require('@schemas/ai/registry');
const {
  DTO_SCHEMA_VERSION,
  COMMON_DTO_SCHEMAS,
} = require('@schemas/BaseSchema');

describe('common DTO schemas', () => {
  it('registers the five shared contracts', () => {
    expect(registry.list().map(({ title }) => title)).toEqual([
      'event-dto',
      'workflow-dto',
      'agent-task-dto',
      'approval-dto',
      'agent-report-dto',
    ]);
  });

  it('uses one explicit schema version and rejects extra root fields', () => {
    COMMON_DTO_SCHEMAS.forEach((schema) => {
      expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(schema.properties.schema_version).toEqual({
        const: DTO_SCHEMA_VERSION,
      });
      expect(schema.required).toContain('schema_version');
      expect(schema.additionalProperties).toBe(false);
    });
  });

  it('requires traceable identifiers in workflow and approval contracts', () => {
    const workflow = registry.getByTitle('workflow-dto');
    const approval = registry.getByTitle('approval-dto');

    expect(workflow.required).toEqual(expect.arrayContaining([
      'workflow_id',
      'workflow_type',
      'status',
      'risk_level',
    ]));
    expect(approval.required).toEqual(expect.arrayContaining([
      'approval_id',
      'workflow_id',
      'action_id',
      'payload_hash',
    ]));
  });

  it('requires report period, status, metrics and source-ready structure', () => {
    const report = registry.getByTitle('agent-report-dto');

    expect(report.required).toEqual(expect.arrayContaining([
      'report_id',
      'agent_id',
      'period',
      'status',
      'metrics',
      'generated_at',
    ]));
    expect(report.properties).toHaveProperty('source_refs');
    expect(report.properties.period.additionalProperties).toBe(false);
  });

  it('rejects missing IDs and duplicate schema registration', () => {
    expect(() => new ContractRegistry([{}]))
      .toThrow('Contract schema must define $id');

    const schema = COMMON_DTO_SCHEMAS[0];
    expect(() => new ContractRegistry([schema, schema]))
      .toThrow(`Duplicate contract schema: ${schema.$id}`);
  });

  it('returns null for an unknown contract', () => {
    expect(registry.get('unknown')).toBeNull();
    expect(registry.getByTitle('unknown')).toBeNull();
  });
});
