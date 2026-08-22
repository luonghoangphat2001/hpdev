import { requestJson } from './request.js';

export function getStats() {
  return requestJson('/api/stats');
}
