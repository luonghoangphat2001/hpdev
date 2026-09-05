import { api } from '@/api/request';

export const sendChatMessage = (message, model) => api.post('/chat', { message, model });
