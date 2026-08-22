import { requestJson, sendJson } from './request.js';

export function generateQuizQuestions(mode = 'multiple_choice', topicNo = null) {
  const query = new URLSearchParams({ mode });

  if (topicNo) {
    query.set('topic', topicNo);
  }

  return requestJson(`/api/quiz/generate?${query}`);
}

export function submitQuizAnswer(data) {
  return sendJson('/api/quiz/submit', 'POST', data);
}

export function getQuizLeaderboard() {
  return requestJson('/api/quiz/leaderboard');
}
