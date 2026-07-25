'use strict';

class PiiRedactorService {
  redactText(text = '') {
    if (typeof text !== 'string') return text;

    // Mask phone numbers (Vietnamese 10 digits starting with 0)
    let redacted = text.replace(/0\d{9}/g, '0*********');

    // Mask emails
    redacted = redacted.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '***@***.***');

    return redacted;
  }
}

module.exports = PiiRedactorService;
