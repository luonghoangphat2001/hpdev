import { api } from './request';

export const getConfig = () => api.get('/config');
export const updateConfig = (data) => api.post('/config', data);
export const getModelsByProvider = (provider) => api.get(`/models/${provider}`);
