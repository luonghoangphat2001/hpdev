'use strict';

class OutputClassifierService {
  classifyOutput({ text = '', confidenceScore = 1.0 }) {
    let category = 'INFERENCE';
    if (text.startsWith('FACT:') || text.includes('dữ liệu từ SSOT')) {
      category = 'FACT';
    } else if (text.startsWith('RECOMMENDATION:') || text.includes('đề xuất') || text.includes('propose')) {
      category = 'RECOMMENDATION';
    }

    return Object.freeze({
      text,
      category,
      confidenceScore,
      classifiedAt: new Date().toISOString(),
    });
  }
}

module.exports = OutputClassifierService;
