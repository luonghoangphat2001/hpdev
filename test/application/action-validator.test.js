'use strict';

const actionCatalog = require('../../src/contracts/actions/ecommerce-action.catalog');
const actionSchemas = require('../../src/contracts/actions/ecommerce-action.schemas');
const ActionValidatorService = require('../../src/application/services/action-validator.service');

describe('ActionValidatorService', () => {
  const validator = new ActionValidatorService();

  it('defines one strict request schema for every allowlisted action', () => {
    expect(Object.keys(actionSchemas).sort())
      .toEqual(actionCatalog.list().map(({ name }) => name).sort());
    Object.values(actionSchemas).forEach((schema) => {
      expect(schema.additionalProperties).toBe(false);
    });
  });

  it('accepts a valid purchase-order draft grounded in Ecommerce fields', () => {
    expect(validator.validate('inventory.purchase_order_draft.create', {
      supplier_name: 'Supplier A',
      total_amount: 450000,
      expected_delivery_date: '2026-08-01',
    })).toMatchObject({
      action: {
        permission: 'purchase_order_draft.create',
      },
    });
  });

  it('accepts only actual Ecommerce order statuses', () => {
    expect(() => validator.validate('ops.order_status.update', {
      order_id: 10,
      target_status: 'delivering',
    })).not.toThrow();
    expect(() => validator.validate('ops.order_status.update', {
      order_id: 10,
      target_status: 'magically_done',
    })).toThrow(expect.objectContaining({
      statusCode: 422,
      details: expect.objectContaining({ code: 'action_payload_invalid' }),
    }));
  });

  it('rejects missing, malformed and unexpected fields', () => {
    expect(() => validator.validate('finance.refund.execute', {
      order_id: 1,
      amount: -1,
      reason: 'x',
      admin: true,
    })).toThrow(expect.objectContaining({
      details: expect.objectContaining({
        code: 'action_payload_invalid',
        errors: expect.any(Array),
      }),
    }));
  });

  it('rejects actions outside the allowlist', () => {
    expect(() => validator.validate('database.raw.execute', {}))
      .toThrow(expect.objectContaining({
        statusCode: 403,
        details: {
          code: 'action_not_allowlisted',
          action: 'database.raw.execute',
        },
      }));
  });
});
