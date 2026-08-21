'use strict';

const ClassifierService = require('../../../src/services/ai/critics/classifier.service');

describe('T080: Fact/Inference/Recommendation Classifier', () => {
  test('classifies fact, recommendation, and inference', () => {
    const classifier = new ClassifierService();

    expect(classifier.classifyOutput({ text: 'FACT: Order #123 is delivered' }).category).toBe('FACT');
    expect(classifier.classifyOutput({ text: 'RECOMMENDATION: đề xuất tăng tồn kho' }).category).toBe('RECOMMENDATION');
    expect(classifier.classifyOutput({ text: 'Có thể nhu cầu tăng vào tuần sau' }).category).toBe('INFERENCE');
  });
});
