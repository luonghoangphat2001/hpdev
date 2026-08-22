'use strict';

const {
  MIN_WEIGHT,
  weightForPerformance,
  weightedShuffle,
} = require('../../src/services/learning/AdaptiveSelector');

describe('AdaptiveSelector', () => {
  it('raises wrong-item weight and keeps mastered items eligible', () => {
    expect(weightForPerformance({ wrong_count: 4, correct_count: 0 })).toBe(8);
    expect(weightForPerformance({ wrong_count: 0, correct_count: 99 })).toBe(MIN_WEIGHT);
    expect(weightForPerformance({ wrong_count: 0, correct_count: 99 })).toBeGreaterThan(0);
  });

  it('uses weights while selecting without replacement', () => {
    const history = new Map([
      [1, { correct_count: 20, wrong_count: 0 }],
      [2, { correct_count: 0, wrong_count: 5 }],
    ]);
    const selected = weightedShuffle([{ id: 1 }, { id: 2 }], history, () => 0.5);
    expect(selected.map((item) => item.id)).toEqual([2, 1]);
  });
});
