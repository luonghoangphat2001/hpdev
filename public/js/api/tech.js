import { requestJson, sendJson, uploadFile } from './request.js';

export function getTechStacks() {
  return requestJson('/api/tech/stacks');
}

export function getTechQuestions(filters = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  }

  return requestJson(`/api/tech/questions?${query}`);
}

export function saveTechProgress(id, data) {
  const encodedId = encodeURIComponent(id);

  return sendJson(
    `/api/tech/questions/${encodedId}/progress`,
    'POST',
    data,
  );
}

export function createTechQuestion(data) {
  return sendJson('/api/tech/questions', 'POST', data);
}

export function updateTechQuestion(id, data) {
  const encodedId = encodeURIComponent(id);

  return sendJson(
    `/api/tech/questions/${encodedId}`,
    'PUT',
    data,
  );
}

export function deleteTechQuestion(id) {
  const encodedId = encodeURIComponent(id);

  return requestJson(`/api/tech/questions/${encodedId}`, {
    method: 'DELETE',
  });
}

export function generateTechQuestionAI(data) {
  return sendJson('/api/tech/ai-generate', 'POST', data);
}

export function batchGenerateTechAI(data) {
  return sendJson('/api/tech/ai-batch-generate', 'POST', data);
}

export function mockInterviewAI(data) {
  return sendJson('/api/tech/ai-mock-interview', 'POST', data);
}

export function importTechQuestions(file, stack) {
  return uploadFile('/api/tech/import', file, {
    default_stack: stack,
  });
}

export function exportTechQuestions(stack) {
  const encodedStack = encodeURIComponent(stack);

  globalThis.location.href = `/api/tech/export?stack=${encodedStack}`;
}
