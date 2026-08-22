<template>
  <div id="page-chat" class="flex flex-col h-full min-h-0 overflow-hidden bg-gray-900 text-gray-100">
    <!-- Model selector bar -->
    <div id="model-bar" class="flex items-center justify-center py-2 px-3 border-b border-gray-700 bg-gray-900 relative shrink-0">
      <ModelSelector />
    </div>

    <!-- Messages Window -->
    <div ref="chatContainer" id="chat-window" class="flex-1 overflow-y-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 sm:space-y-6 touch-scroll">
      <!-- Empty Welcome State -->
      <div v-if="chatStore.messages.length === 0" id="chat-empty" class="flex flex-col items-center justify-center h-full text-center px-4">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-3 sm:mb-4 shadow-lg ring-2 ring-indigo-500/20" style="width: 56px; height: 56px; min-width: 56px; min-height: 56px;">
          <img src="/images/dan.png" alt="Đần" width="56" height="56" class="w-full h-full object-cover rounded-full" style="width: 56px; height: 56px; aspect-ratio: 1/1;" loading="eager" decoding="sync" />
        </div>
        <h2 class="text-lg sm:text-xl font-semibold text-gray-200 mb-1.5 sm:mb-2">Xin chào! Tôi là Đần</h2>
        <p class="text-gray-400 text-xs sm:text-sm max-w-xs leading-relaxed">AI được tạo bởi Hoàng Phát, kết hợp nhiều model AI. Hỏi tôi bất cứ điều gì!</p>
      </div>

      <!-- Message Bubbles -->
      <div 
        v-for="msg in chatStore.messages" 
        :key="msg.id" 
        :class="['flex gap-2.5 sm:gap-3 max-w-3xl w-full', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto']"
      >
        <div 
          class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow"
          :class="msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-indigo-400 border border-gray-700'"
        >
          {{ msg.role === 'user' ? authStore.userInitial : '🤖' }}
        </div>

        <div 
          :class="[
            'p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow whitespace-pre-wrap break-words',
            msg.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : msg.isError 
                ? 'bg-red-900/30 border border-red-700/60 text-red-300' 
                : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
          ]"
        >
          <p>{{ msg.content }}</p>
          <span class="block text-[10px] text-right mt-1 opacity-60 font-mono">{{ msg.time }}</span>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="chatStore.loading" class="flex items-center gap-2.5 mr-auto">
        <div class="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-indigo-400">🤖</div>
        <div class="px-3.5 py-2.5 rounded-2xl bg-gray-800 border border-gray-700 text-xs text-indigo-300 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
          <span class="ml-1 font-mono">Đần đang trả lời...</span>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="shrink-0 border-t border-gray-700/80 bg-gray-900 px-3 sm:px-4 py-2.5 sm:py-4">
      <div class="max-w-3xl mx-auto">
        <form @submit.prevent="handleSend" class="flex items-end gap-2 sm:gap-3 bg-gray-800 rounded-2xl border border-gray-700 focus-within:border-indigo-500 px-3 sm:px-4 py-2.5 sm:py-3 transition shadow-lg">
          <textarea 
            v-model="inputText" 
            @keydown.enter.exact.prevent="handleSend" 
            rows="1" 
            placeholder="Hỏi Đần điều gì đó… (Shift+Enter để xuống dòng)" 
            class="flex-1 bg-transparent resize-none text-base sm:text-sm focus:outline-none text-white placeholder-gray-500 max-h-36 sm:max-h-40 leading-relaxed"
          ></textarea>
          <button 
            type="submit" 
            :disabled="!inputText.trim() || chatStore.loading" 
            class="shrink-0 w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl sm:rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow" 
            aria-label="Gửi tin nhắn"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import ModelSelector from '../components/common/ModelSelector.vue';

const authStore = useAuthStore();
const chatStore = useChatStore();
const inputText = ref('');
const chatContainer = ref(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

watch(() => chatStore.messages.length, scrollToBottom);

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || chatStore.loading) return;
  inputText.value = '';
  await chatStore.sendMessage(text);
  scrollToBottom();
};
</script>
