import { requestJson, sendJson } from './request.js';

export function getStudySchedules(includeInactive = false) {
  const query = includeInactive ? '?include_inactive=1' : '';

  return requestJson(`/api/study-schedules${query}`);
}

export function createStudySchedule(data) {
  return sendJson('/api/study-schedules', 'POST', data);
}

export function updateStudySchedule(id, data) {
  const encodedId = encodeURIComponent(id);

  return sendJson(`/api/study-schedules/${encodedId}`, 'PUT', data);
}

export function deleteStudySchedule(id) {
  const encodedId = encodeURIComponent(id);

  return requestJson(`/api/study-schedules/${encodedId}`, {
    method: 'DELETE',
  });
}
