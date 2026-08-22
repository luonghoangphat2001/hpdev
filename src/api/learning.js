import { api } from './request';

export const getLearnings = (category = '') => api.get(`/learning/categories?category=${category}`);
export const getLearningItems = (params = {}) => api.get('/learning/items', { params });
export const saveLearningItem = (item) => api.post('/learning/items', item);
export const deleteLearningItem = (id) => api.delete(`/learning/items/${id}`);
export const toggleBookmark = (id, bookmarked) => api.patch(`/learning/items/${id}/bookmark`, { bookmarked });
export const importLearningExcel = (formData) => api.post('/learning/import-excel', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const generateLearningAI = (payload) => api.post('/learning/generate-ai', payload);
export const evaluateWritingAI = (payload) => api.post('/learning/evaluate-writing', payload);
export const evaluateSpeakingAI = (payload) => api.post('/learning/evaluate-speaking', payload);
export const submitQuizResult = (payload) => api.post('/learning/quiz-submit', payload);
