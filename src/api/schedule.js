import { api } from './request';

export const getSchedules = (includeInactive = false) =>
  api.get(`/study-schedules${includeInactive ? '?include_inactive=1' : ''}`);
export const createSchedule = (data) => api.post('/study-schedules', data);
export const updateSchedule = (id, data) => api.put(`/study-schedules/${encodeURIComponent(id)}`, data);
export const deleteSchedule = (id) => api.delete(`/study-schedules/${encodeURIComponent(id)}`);
