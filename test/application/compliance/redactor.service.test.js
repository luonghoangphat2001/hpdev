'use strict';

const PiiRedactorPolicy = require('../../../src/policy/compliance/pii-redactor.policy');

describe('T084: PII Redactor Service', () => {
  test('redacts phone numbers and emails', () => {
    const redactor = new PiiRedactorPolicy();
    const text = 'Customer John Doe, phone 0912345678, email john@example.com';
    const redacted = redactor.redactText(text);

    expect(redacted).not.toContain('0912345678');
    expect(redacted).not.toContain('john@example.com');
    expect(redacted).toContain('0*********');
    expect(redacted).toContain('***@***.***');
  });
});
