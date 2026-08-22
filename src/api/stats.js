import { api } from './request';

export const getStats = () => api.get('/stats');
export const getHistory = (limit = 50, offset = 0) => api.get(`/history?limit=${limit}&offset=${offset}`);
export const getLogs = (limit = 100) => api.get(`/logs?limit=${limit}`);
export const getOpenClawLogs = (limit = 50) => api.get(`/openclaw/logs?limit=${limit}`);
