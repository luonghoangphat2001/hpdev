'use strict';

/**
 * Shared boundary for AI/imported learning content.
 * Keeps JSON repair and legacy wrapper handling out of controllers and DB code.
 */
function parseJson(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return null;

  const text = value.trim().replace(/^\uFEFF/, '');
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  const candidate = fenced ? fenced[1].trim() : text;
  try { return JSON.parse(candidate); } catch (_) {}

  const startsArray = candidate[0] === '[';
  for (let start = 0; start < candidate.length; start++) {
    if (candidate[start] !== '[' && candidate[start] !== '{') continue;
    // If the outer array is incomplete, let the recovery pass below collect
    // all complete objects instead of returning only the first object.
    if (startsArray && candidate[start] === '{') continue;
    const stack = [];
    let quoted = false;
    let escaped = false;
    for (let i = start; i < candidate.length; i++) {
      const ch = candidate[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') quoted = false;
        continue;
      }
      if (ch === '"') { quoted = true; continue; }
      if (ch === '[' || ch === '{') stack.push(ch);
      if (ch === ']' || ch === '}') {
        if (stack[stack.length - 1] !== (ch === ']' ? '[' : '{')) break;
        stack.pop();
        if (!stack.length) {
          try { return JSON.parse(candidate.slice(start, i + 1)); } catch (_) {}
          break;
        }
      }
    }
  }

  // A provider may truncate the final part of a JSON array. Recover every
  // complete object inside it instead of returning one "Generated Content"
  // fallback row and persisting the raw response.
  const recovered = [];
  let objectStart = -1;
  let depth = 0;
  quoted = false;
  escaped = false;
  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === '{') {
      if (depth === 0) objectStart = i;
      depth++;
    } else if (ch === '}' && depth > 0) {
      depth--;
      if (depth === 0 && objectStart >= 0) {
        try { recovered.push(JSON.parse(candidate.slice(objectStart, i + 1))); } catch (_) {}
        objectStart = -1;
      }
    }
  }
  if (recovered.length) return recovered.length === 1 ? recovered[0] : recovered;

  return null;
}

function isLearningItem(value) {
  return value && typeof value === 'object' && (
    typeof value.title === 'string' || typeof value.word === 'string'
  );
}

function unpackItems(items) {
  const result = [];
  const queue = Array.isArray(items) ? [...items] : [items];

  while (queue.length) {
    const value = queue.shift();
    const parsed = typeof value === 'string' ? parseJson(value) : value;
    if (!parsed) continue;
    if (Array.isArray(parsed)) {
      queue.unshift(...parsed);
      continue;
    }

    // Legacy fallback rows stored the complete AI array in prompt/content.
    if (!isLearningItem(parsed) || parsed.title === 'Generated Content') {
      const nested = parseJson(parsed.prompt) || parseJson(parsed.content);
      if (Array.isArray(nested)) {
        queue.unshift(...nested);
        continue;
      }
    }
    if (isLearningItem(parsed)) result.push(normalizeItem(parsed));
  }
  return result;
}

function normalizeItem(item, defaults = {}) {
  const content = parseJson(item.content) || {};
  const sampleSolution = parseJson(item.sample_solution ?? item.sampleSolution) || {};
  const rawTitle = String(item.title || item.word || content.word || 'Untitled').trim();
  // AI often adds a batch-local ordinal ("Câu hỏi 1:") to every title.
  // The item order already provides numbering, so keep only the real title.
  const title = rawTitle
    .replace(/^(?:câu hỏi|cau hoi|question)\s*\d+\s*[:.)\-–—]\s*/i, '')
    .trim() || rawTitle;
  return {
    ...item,
    title,
    prompt: String(item.prompt || content.example || '').trim(),
    level: item.level || defaults.level || 'junior',
    content,
    sample_solution: sampleSolution,
    tags: item.tags || defaults.tags || '',
  };
}

module.exports = { parseJson, unpackItems, normalizeItem };
