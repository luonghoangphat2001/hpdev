'use strict';

const assert = require('assert');
const { parseJson, unpackItems, normalizeItem } = require('../../src/services/learning/ContentNormalizer');

describe('ContentNormalizer', () => {
  it('extracts balanced JSON from an AI response with surrounding text', () => {
    const value = parseJson('Đây là kết quả:\n[{"title":"A","prompt":"P"}]\nHết.');
    assert.deepStrictEqual(value, [{ title: 'A', prompt: 'P' }]);
  });

  it('unpacks a legacy Generated Content wrapper', () => {
    const items = unpackItems([{
      title: 'Generated Content',
      prompt: '[{"title":"A","prompt":"P"},{"title":"B","prompt":"Q"}]',
    }]);
    assert.deepStrictEqual(items.map((item) => item.title), ['A', 'B']);
  });

  it('normalizes content and solution JSON strings', () => {
    const item = normalizeItem({
      word: 'resilience',
      content: '{"meaning":"kiên trì"}',
      sampleSolution: '{"synonyms":["tenacity"]}',
    });
    assert.strictEqual(item.title, 'resilience');
    assert.strictEqual(item.content.meaning, 'kiên trì');
    assert.deepStrictEqual(item.sample_solution.synonyms, ['tenacity']);
  });

  it('removes batch-local question numbering from titles', () => {
    assert.strictEqual(normalizeItem({ title: 'Câu hỏi 1: Kiểm tra chuỗi PHP' }).title, 'Kiểm tra chuỗi PHP');
    assert.strictEqual(normalizeItem({ title: 'Question 4 - Array trong PHP' }).title, 'Array trong PHP');
  });

  it('recovers complete objects from a truncated JSON array', () => {
    const value = parseJson('[{"title":"A","prompt":"P"},{"title":"B","prompt":"Q"},{"title":"C"');
    assert.deepStrictEqual(value.map((item) => item.title), ['A', 'B']);
  });
});
