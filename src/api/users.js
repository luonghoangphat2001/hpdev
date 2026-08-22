import { api } from './request';

export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const deleteUser = (username) => api.delete(`/users/${username}`);
