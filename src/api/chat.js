import { api } from './request';

export const sendChatMessage = (message, model) => api.post('/chat', { message, model });
