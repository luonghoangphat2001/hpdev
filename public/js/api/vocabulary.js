import { requestJson, sendJson, uploadFile } from './request.js';

export function getVocabularyConfig() {
  return requestJson('/api/vocabulary/config');
}

export function saveVocabularyConfig(data) {
  return sendJson('/api/vocabulary/config', 'POST', data);
}

export function getVocabularyTopics() {
  return requestJson('/api/vocabulary/topics');
}

export function updateVocabularyTopic(topicNo, data) {
  const encodedTopicNo = encodeURIComponent(topicNo);

  return sendJson(
    `/api/vocabulary/topics/${encodedTopicNo}`,
    'PUT',
    data,
  );
}

export function getVocabularyWords(topicNo) {
  const encodedTopicNo = encodeURIComponent(topicNo);

  return requestJson(`/api/vocabulary/words?topic=${encodedTopicNo}`);
}

export function createVocabularyWord(data) {
  return sendJson('/api/vocabulary/words', 'POST', data);
}

export function updateVocabularyWord(id, data) {
  const encodedId = encodeURIComponent(id);

  return sendJson(
    `/api/vocabulary/words/${encodedId}`,
    'PUT',
    data,
  );
}

export function deleteVocabularyWord(id) {
  const encodedId = encodeURIComponent(id);

  return requestJson(`/api/vocabulary/words/${encodedId}`, {
    method: 'DELETE',
  });
}

export function importVocabulary(file) {
  return uploadFile('/api/vocabulary/import', file);
}

export function getExportVocabularyUrl(topicNo) {
  const encodedTopicNo = encodeURIComponent(topicNo);

  return `/api/vocabulary/export?topic_no=${encodedTopicNo}`;
}

export function fillVocabularyPronunciations() {
  return requestJson('/api/vocabulary/fill-pronunciations', {
    method: 'POST',
  });
}

export function sendWordToDiscord(id) {
  const encodedId = encodeURIComponent(id);

  return requestJson(`/api/vocabulary/words/${encodedId}/send-discord`, {
    method: 'POST',
  });
}

export function getVocabularyHistory() {
  return requestJson('/api/vocabulary/history');
}
