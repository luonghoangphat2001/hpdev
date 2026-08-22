import { requestJson, sendJson } from './request.js';

export async function getCurrentUser() {
  try {
    return await requestJson('/api/me');
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return null;
    }

    throw error;
  }
}

export function changePassword(password) {
  return sendJson('/api/password', 'POST', {
    password,
  });
}
