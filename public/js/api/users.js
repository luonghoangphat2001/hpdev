import { requestJson, sendJson } from './request.js';

export function getUsers() {
  return requestJson('/api/users');
}

export function addUser(username, password, role) {
  return sendJson('/api/users', 'POST', {
    username,
    password,
    role,
  });
}

export function deleteUser(username) {
  const encodedUsername = encodeURIComponent(username);

  return requestJson(`/api/users/${encodedUsername}`, {
    method: 'DELETE',
  });
}

export function updateUserPassword(username, password) {
  const encodedUsername = encodeURIComponent(username);

  return sendJson(`/api/users/${encodedUsername}/password`, 'POST', {
    password,
  });
}
