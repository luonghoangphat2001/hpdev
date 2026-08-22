import { requestJson, sendJson, uploadFile } from './request.js';

export function getLearningCategories() {
  return requestJson('/api/learning/categories');
}

export function getLearnings(category = 'tech', type = '') {
  const query = new URLSearchParams({ category });

  if (type) {
    query.set('type', type);
  }

  return requestJson(`/api/learning/learnings?${query}`);
}

export function getLearningDetail(slug) {
  const encodedSlug = encodeURIComponent(slug);

  return requestJson(`/api/learning/learnings/${encodedSlug}`);
}

export function updateTopic(id, data) {
  const encodedId = encodeURIComponent(id);

  return sendJson(
    `/api/learning/topics/${encodedId}`,
    'PUT',
    data,
  );
}

export function getLearningItems(filters = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }

  return requestJson(`/api/learning/items?${query}`);
}

export function getLearningItemDetail(id) {
  const encodedId = encodeURIComponent(id);

  return requestJson(`/api/learning/items/${encodedId}`);
}

export function createLearningItem(data) {
  return sendJson('/api/learning/items', 'POST', data);
}

export function updateLearningItem(id, data) {
  const encodedId = encodeURIComponent(id);

  return sendJson(
    `/api/learning/items/${encodedId}`,
    'PUT',
    data,
  );
}

export function deleteLearningItem(id) {
  const encodedId = encodeURIComponent(id);

  return requestJson(`/api/learning/items/${encodedId}`, {
    method: 'DELETE',
  });
}

export function updateLearningProgress(id, data) {
  const encodedId = encodeURIComponent(id);

  return sendJson(
    `/api/learning/items/${encodedId}/progress`,
    'POST',
    data,
  );
}

export function toggleLearningBookmark(id, isBookmarked) {
  return updateLearningProgress(id, {
    is_bookmarked: isBookmarked ? 1 : 0,
  });
}

export function generateLearningAI(data) {
  return sendJson('/api/learning/ai/generate', 'POST', data);
}

export function saveLearningAIBatch(data) {
  return sendJson('/api/learning/ai/save-batch', 'POST', data);
}

export function evaluateLearningAI(data) {
  return sendJson('/api/learning/ai/evaluate', 'POST', data);
}

export function buildQuiz(topicNo, count = 5, mode = 'multiple_choice', level = '') {
  const query = new URLSearchParams({ count, mode });

  if (topicNo) {
    query.set('topic_no', topicNo);
  }
  if (level) {
    query.set('level', level);
  }

  return requestJson(`/api/learning/quiz/generate?${query}`);
}

export function buildPracticeExam(filters = {}) {
  const query = new URLSearchParams({ count: filters.count || 50 });
  if (filters.category) query.set('category', filters.category);
  if (filters.level) query.set('level', filters.level);
  if (filters.learnings?.length) query.set('learnings', filters.learnings.join(','));
  if (filters.types?.length) query.set('types', filters.types.join(','));
  return requestJson(`/api/learning/practice-exam?${query}`);
}

export function submitPracticeExam(attempts = []) {
  return sendJson('/api/learning/practice-exam/submit', 'POST', { attempts });
}

export function submitQuiz(score, total, details = {}) {
  return sendJson('/api/learning/quiz/submit', 'POST', {
    score,
    total,
    details,
  });
}

export function getQuizLeaderboard(limit = 10) {
  return requestJson(`/api/learning/quiz/leaderboard?limit=${limit}`);
}

export function fillVocabPronunciations() {
  return requestJson('/api/learning/vocabulary/fill-pronunciations', {
    method: 'POST',
  });
}

export function getLearningConfig() {
  return requestJson('/api/learning/config');
}

export function saveLearningConfig(data) {
  return sendJson('/api/learning/config', 'POST', data);
}

export function sendLearningDiscord(id) {
  const encodedId = encodeURIComponent(id);

  return requestJson(`/api/learning/items/${encodedId}/discord`, {
    method: 'POST',
  });
}

export function importLearningExcel(id, file) {
  const encodedId = encodeURIComponent(id);

  return uploadFile(`/api/learning/import/${encodedId}`, file);
}
