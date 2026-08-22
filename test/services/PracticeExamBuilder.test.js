'use strict';

const assert = require('assert');
const { buildPracticeExam, difficultyFor } = require('../../src/services/learning/PracticeExamBuilder');

describe('PracticeExamBuilder', () => {
  const fixedRandom = () => 0.42;

  it('maps both career and CEFR labels to the same difficulty scale', () => {
    assert.strictEqual(difficultyFor('Beginner'), 'easy');
    assert.strictEqual(difficultyFor('A1'), 'easy');
    assert.strictEqual(difficultyFor('Intermediate'), 'medium');
    assert.strictEqual(difficultyFor('B2'), 'medium');
    assert.strictEqual(difficultyFor('Senior'), 'hard');
    assert.strictEqual(difficultyFor('C1'), 'hard');
  });

  it('selects 20 unique questions balanced from hard to easy', () => {
    const levels = ['senior', 'intermediate', 'beginner'];
    const pool = Array.from({ length: 36 }, (_, index) => ({
      id: index + 1,
      learning_id: (index % 8) + 1,
      learning_slug: `stack-${(index % 8) + 1}`,
      level: levels[index % levels.length],
    }));

    const exam = buildPracticeExam(pool, 20, fixedRandom);
    const counts = exam.reduce((result, item) => {
      result[item.difficulty] += 1;
      return result;
    }, { hard: 0, medium: 0, easy: 0 });

    assert.strictEqual(exam.length, 20);
    assert.strictEqual(new Set(exam.map((item) => item.id)).size, 20);
    assert.deepStrictEqual(counts, { hard: 7, medium: 7, easy: 6 });
    assert.strictEqual(new Set(exam.map((item) => item.learning_slug)).size, 8);
    assert.deepStrictEqual(
      exam.map((item) => item.difficulty),
      [...exam.map((item) => item.difficulty)].sort((a, b) => ['hard', 'medium', 'easy'].indexOf(a) - ['hard', 'medium', 'easy'].indexOf(b))
    );
  });

  it('defaults to 50 questions with a 17/17/16 difficulty balance', () => {
    const levels = ['senior', 'intermediate', 'beginner'];
    const pool = Array.from({ length: 90 }, (_, index) => ({
      id: index + 1,
      learning_id: (index % 8) + 1,
      learning_slug: `stack-${(index % 8) + 1}`,
      level: levels[index % levels.length],
    }));

    const exam = buildPracticeExam(pool, undefined, fixedRandom);
    const counts = exam.reduce((result, item) => {
      result[item.difficulty] += 1;
      return result;
    }, { hard: 0, medium: 0, easy: 0 });

    assert.strictEqual(exam.length, 50);
    assert.deepStrictEqual(counts, { hard: 17, medium: 17, easy: 16 });
    assert.strictEqual(new Set(exam.map((item) => item.learning_slug)).size, 8);
  });

  it('caps a requested practice exam at 50 questions', () => {
    const pool = Array.from({ length: 120 }, (_, index) => ({
      id: index + 1,
      learning_slug: 'php',
      level: ['senior', 'intermediate', 'beginner'][index % 3],
    }));
    assert.strictEqual(buildPracticeExam(pool, 100, fixedRandom).length, 50);
  });

  it('fills the exam when one difficulty has too few questions', () => {
    const pool = Array.from({ length: 25 }, (_, index) => ({
      id: index + 1,
      learning_slug: 'php',
      level: index < 2 ? 'senior' : 'junior',
    }));
    assert.strictEqual(buildPracticeExam(pool, 20, fixedRandom).length, 20);
  });

  it('never exceeds the requested count while covering stacks with uneven levels', () => {
    const pool = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      learning_slug: `stack-${index % 8}`,
      level: 'senior',
    }));
    assert.strictEqual(buildPracticeExam(pool, 20, fixedRandom).length, 20);
  });

  it('prioritizes a previously wrong item without changing difficulty quotas', () => {
    const pool = [
      { id: 1, learning_slug: 'php', level: 'senior' },
      { id: 2, learning_slug: 'php', level: 'senior' },
    ];
    const history = new Map([
      [1, { correct_count: 20, wrong_count: 0 }],
      [2, { correct_count: 0, wrong_count: 5 }],
    ]);

    const exam = buildPracticeExam(pool, 1, () => 0.5, history);
    assert.strictEqual(exam[0].id, 2);
    assert.strictEqual(exam[0].difficulty, 'hard');
  });
});
