import { api } from './request';

export const getStats = () => api.get('/stats');
export const getHistory = (limit = 50, offset = 0) => api.get(`/history?limit=${limit}&offset=${offset}`);
export const getLogs = () => api.get('/logs');
export const getLogContent = (filename) => api.get(`/logs/${encodeURIComponent(filename)}/content`, { responseType: 'text' });
export const cleanLogs = (days) => api.post('/logs/clean', { days });
export const getOpenClawOverview = () => api.get('/openclaw/overview');
export const getOpenClawAgents = () => api.get('/openclaw/agents');
export const controlOpenClawAgent = (agentId, data) => api.post(`/openclaw/agents/${encodeURIComponent(agentId)}/control`, data);
export const getOpenClawWorkflows = (params = {}) => {
  const query = new URLSearchParams({ limit: '50', offset: '0' });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  return api.get(`/openclaw/workflows?${query}`);
};
export const getOpenClawWorkflow = (workflowId) => api.get(`/openclaw/workflows/${encodeURIComponent(workflowId)}`);
export const getOpenClawLogs = (limit = 30, offset = 0) => api.get(`/openclaw-logs?limit=${limit}&offset=${offset}`);
