import { defineStore } from 'pinia';
import { sendChatMessage } from '@/api/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    activeModel: localStorage.getItem('dan_active_model') || 'gemini',
    loading: false,
  }),
  actions: {
    setModel(model) {
      this.activeModel = model;
      localStorage.setItem('dan_active_model', model);
    },
    async sendMessage(text) {
      if (!text.trim() || this.loading) return;

      this.messages.push({
        id: Date.now(),
        role: 'user',
        content: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      this.loading = true;
      try {
        const res = await sendChatMessage(text, this.activeModel);
        this.messages.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: res.response || res.message || 'Không có phản hồi từ máy chủ.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (err) {
        this.messages.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: `❌ Lỗi: ${err.message}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } finally {
        this.loading = false;
      }
    },
    clearChat() {
      this.messages = [];
    },
  },
});
