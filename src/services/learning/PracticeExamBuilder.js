'use strict';

const { weightedShuffle } = require('@services/learning/AdaptiveSelector');

const DIFFICULTY_ORDER = ['hard', 'medium', 'easy'];

const LEVEL_BUCKETS = {
  easy: new Set(['begin', 'beginner', 'junior', 'a1', 'a2', 'basic', 'easy']),
  medium: new Set(['intermediate', 'mid', 'middle', 'b1', 'b2', 'medium']),
  hard: new Set(['advanced', 'senior', 'c1', 'c2', 'expert', 'hard']),
};

function difficultyFor(level) {
  const normalized = String(level || '').trim().toLowerCase();
  for (const bucket of DIFFICULTY_ORDER) {
    if (LEVEL_BUCKETS[bucket].has(normalized)) return bucket;
  }
  return 'medium';
}

function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function buildQuotas(count) {
  const quotas = { hard: 0, medium: 0, easy: 0 };
  for (let index = 0; index < count; index += 1) {
    quotas[DIFFICULTY_ORDER[index % DIFFICULTY_ORDER.length]] += 1;
  }
  return quotas;
}

/**
 * Pick a random exam while keeping difficulty counts within one question of
 * each other. When possible, every requested learning/stack is represented.
 */
function buildPracticeExam(pool, requestedCount = 50, random = Math.random, performanceByItem = new Map()) {
  const count = Math.min(Math.max(Number(requestedCount) || 50, 1), 50);
  const candidates = (Array.isArray(pool) ? pool : []).map((item) => ({
    ...item,
    difficulty: difficultyFor(item.level),
  }));
  const quotas = buildQuotas(Math.min(count, candidates.length));
  const selected = [];
  const selectedIds = new Set();

  const take = (item) => {
    if (!item || selectedIds.has(item.id)) return false;
    selected.push(item);
    selectedIds.add(item.id);
    const quotaBucket = quotas[item.difficulty] > 0
      ? item.difficulty
      : [...DIFFICULTY_ORDER].sort((a, b) => quotas[b] - quotas[a]).find((bucket) => quotas[bucket] > 0);
    if (quotaBucket) quotas[quotaBucket] -= 1;
    return true;
  };

  // First reserve one slot per learning so a 20-question exam does not happen
  // to omit a requested stack merely because of random selection.
  const learningKeys = shuffle(
    [...new Set(candidates.map((item) => item.learning_slug || String(item.learning_id)))],
    random
  );
  for (const learningKey of learningKeys.slice(0, count)) {
    const available = candidates.filter((item) =>
      (item.learning_slug || String(item.learning_id)) === learningKey && !selectedIds.has(item.id)
    );
    const preferredBucket = [...DIFFICULTY_ORDER]
      .sort((a, b) => quotas[b] - quotas[a])
      .find((bucket) => quotas[bucket] > 0 && available.some((item) => item.difficulty === bucket));
    const choices = preferredBucket
      ? available.filter((item) => item.difficulty === preferredBucket)
      : available;
    take(weightedShuffle(choices, performanceByItem, random)[0]);
  }

  for (const bucket of DIFFICULTY_ORDER) {
    const choices = weightedShuffle(
      candidates.filter((item) => item.difficulty === bucket && !selectedIds.has(item.id)),
      performanceByItem,
      random
    );
    while (quotas[bucket] > 0 && choices.length) take(choices.shift());
  }

  // A level can have too few rows. Fill the remaining seats from any unused
  // theory question rather than returning a short exam.
  const remaining = weightedShuffle(
    candidates.filter((item) => !selectedIds.has(item.id)),
    performanceByItem,
    random
  );
  while (selected.length < count && remaining.length) take(remaining.shift());

  return selected.sort(
    (a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
  );
}

module.exports = { buildPracticeExam, difficultyFor };
