import { request } from './request.js';

export function chat(message, model) {
  return request('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      model,
    }),
  });
}
