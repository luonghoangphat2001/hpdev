import { api } from './request';

const query = (params = {}) => {
  const values = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') values.set(key, String(value));
  });
  return values.toString();
};

export const getLearningCategories = () => api.get('/learning/categories');
export const getLearnings = (category = 'tech', type = '') =>
  api.get(`/learning/learnings?${query({ category, type })}`);
export const getLearningDetail = (slug) => api.get(`/learning/learnings/${encodeURIComponent(slug)}`);
export const getLearningItems = (params = {}) => api.get(`/learning/items?${query(params)}`);
export const getLearningItem = (id) => api.get(`/learning/items/${encodeURIComponent(id)}`);

export const saveLearningItem = (item) => item.id
  ? api.put(`/learning/items/${encodeURIComponent(item.id)}`, item)
  : api.post('/learning/items', item);
export const deleteLearningItem = (id) => api.delete(`/learning/items/${encodeURIComponent(id)}`);
export const updateLearningProgress = (id, data) =>
  api.post(`/learning/items/${encodeURIComponent(id)}/progress`, data);
export const toggleBookmark = (id, bookmarked) =>
  updateLearningProgress(id, { is_bookmarked: bookmarked ? 1 : 0 });

export const generateLearningAI = (payload) => api.post('/learning/ai/generate', payload);
export const saveLearningAIBatch = (payload) => api.post('/learning/ai/save-batch', payload);
export const evaluateLearningAI = (payload) => api.post('/learning/ai/evaluate', payload);

export const buildQuiz = (params = {}) => api.get(`/learning/quiz/generate?${query(params)}`);
export const submitQuizResult = (payload) => api.post('/learning/quiz/submit', payload);
export const getQuizLeaderboard = (limit = 10) => api.get(`/learning/quiz/leaderboard?limit=${limit}`);
export const getQuizHistory = (params = {}) => api.get(`/quiz/history?${query(params)}`);
export const getLearningHistory = (params = {}) => api.get(`/learning/history?${query(params)}`);
export const getLearningUserStats = () => api.get('/learning/stats/summary');
export const buildPracticeExam = (params = {}) => api.get(`/learning/practice-exam?${query(params)}`);
export const submitPracticeExam = (attempts) => api.post('/learning/practice-exam/submit', { attempts });

export const getLearningConfig = () => api.get('/learning/config');
export const saveLearningConfig = (data) => api.post('/learning/config', data);
export const sendLearningDiscord = (id) => api.post(`/learning/items/${encodeURIComponent(id)}/discord`);
export const fillVocabPronunciations = () => api.post('/learning/vocabulary/fill-pronunciations');

export const importLearningExcel = (learningId, file) => {
  const body = new FormData();
  body.append('file', file);
  return api.post(`/learning/import/${encodeURIComponent(learningId)}`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const learningExportUrl = (slug = '') => {
  const base = api.defaults.baseURL || '/api';
  return `${base}/learning/export/${encodeURIComponent(slug)}`;
};

export const evaluateWritingAI = evaluateLearningAI;
export const evaluateSpeakingAI = evaluateLearningAI;
