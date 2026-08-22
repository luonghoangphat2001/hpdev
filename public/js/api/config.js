import { requestJson, sendJson } from './request.js';

export function getConfig() {
  return requestJson('/api/config');
}

export function saveConfig(data) {
  return sendJson('/api/config', 'POST', data);
}

export function getModels(provider) {
  const encodedProvider = encodeURIComponent(provider);

  return requestJson(`/api/models/${encodedProvider}`);
}
