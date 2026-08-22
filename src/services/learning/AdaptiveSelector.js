'use strict';

const MIN_WEIGHT = 0.2;
const MAX_WEIGHT = 8;

/**
 * A wrong answer raises the chance that an item is selected again. Correct
 * answers reduce that chance, but MIN_WEIGHT guarantees mastered items remain
 * eligible for spaced review.
 */
function weightForPerformance(performance = {}) {
  const correct = Math.max(0, Number(performance.correct_count) || 0);
  const wrong = Math.max(0, Number(performance.wrong_count) || 0);
  const weight = (1 + (wrong * 2)) / (1 + correct);
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weight));
}

function performanceMap(rows = []) {
  return new Map((Array.isArray(rows) ? rows : []).map((row) => [
    Number(row.item_id),
    row,
  ]));
}

/** Weighted random ordering without replacement. */
function weightedShuffle(items, performanceByItem = new Map(), random = Math.random) {
  const remaining = [...items];
  const result = [];

  while (remaining.length) {
    const weights = remaining.map((item) => weightForPerformance(performanceByItem.get(Number(item.id))));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = Math.min(Math.max(Number(random()) || 0, 0), 0.999999999) * total;
    let selectedIndex = remaining.length - 1;

    for (let index = 0; index < remaining.length; index += 1) {
      cursor -= weights[index];
      if (cursor < 0) {
        selectedIndex = index;
        break;
      }
    }

    result.push(remaining.splice(selectedIndex, 1)[0]);
  }

  return result;
}

module.exports = { MIN_WEIGHT, MAX_WEIGHT, weightForPerformance, performanceMap, weightedShuffle };
