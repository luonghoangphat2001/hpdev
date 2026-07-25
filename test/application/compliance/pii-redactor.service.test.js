'use strict';

const PiiRedactorService = require('../../../src/application/services/compliance/pii-redactor.service');

describe('T084: PII Redactor Service', () => {
  test('redacts phone numbers and emails', () => {
    const redactor = new PiiRedactorService();
    const text = 'Customer John Doe, phone 0912345678, email john@example.com';
    const redacted = redactor.redactText(text);

    expect(redacted).not.toContain('0912345678');
    expect(redacted).not.toContain('john@example.com');
    expect(redacted).toContain('0*********');
    expect(redacted).toContain('***@***.***');
  });
});
