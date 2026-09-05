import { api } from '@/api/request';

export const login = (username, password) => api.post('/login', { username, password });
export const logout = () => api.post('/logout');
export const getMe = () => api.get('/me');
export const changePassword = (currentPassword, newPassword) => 
  api.post('/password', { currentPassword, newPassword });
