import { requestJson } from './request.js';

export function getHistory(limit = 50) {
  return requestJson(`/api/history?limit=${limit}`);
}
