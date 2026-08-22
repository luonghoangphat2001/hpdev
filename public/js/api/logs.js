import { request, requestJson, sendJson } from './request.js';

export function getLogFiles() {
  return requestJson('/api/logs');
}

export function getLogContent(filename) {
  const encodedFilename = encodeURIComponent(filename);

  return request(`/api/logs/${encodedFilename}/content`)
    .then((response) => response.text());
}

export function cleanLogs(days) {
  return sendJson('/api/logs/clean', 'POST', { days });
}
