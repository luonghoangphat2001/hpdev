/**
 * @fileoverview classifier.service - Provides classifier functionality.
 */
'use strict';

/**
 * ClassifierService
 * Manages classifier logic.
 */
class ClassifierService {
  /**
   * classifyOutput - Executes classify output.
   * @param {*} text - Input parameter.
   * @param {*} confidenceScore - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = ClassifierService;
