<template>
  <div class="h-full flex flex-col min-w-0">
    <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg">⚙️</span>
        <h2 class="text-sm font-bold text-white">Cấu hình Hệ thống AI</h2>
      </div>
      <button 
        @click="save" 
        :disabled="configStore.saving"
        class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
      >
        <span>{{ configStore.saving ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      <!-- AI Providers Settings -->
      <div class="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl">
        <h3 class="text-base font-bold text-white mb-4">Các Nhà Cung Cấp AI (Providers)</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Gemini -->
          <div class="p-4 rounded-2xl bg-gray-900 border border-gray-700/80 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-emerald-400 text-sm">Google Gemini</span>
              <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold">Active</span>
            </div>
            <p class="text-xs text-gray-400">Gemini 2.5 Flash / Pro</p>
          </div>

          <!-- Claude -->
          <div class="p-4 rounded-2xl bg-gray-900 border border-gray-700/80 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-400 text-sm">Anthropic Claude</span>
              <span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold">Active</span>
            </div>
            <p class="text-xs text-gray-400">Claude 3.7 Sonnet</p>
          </div>

          <!-- OpenAI -->
          <div class="p-4 rounded-2xl bg-gray-900 border border-gray-700/80 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-teal-400 text-sm">OpenAI</span>
              <span class="px-2 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 font-semibold">Active</span>
            </div>
            <p class="text-xs text-gray-400">GPT-4o Mini</p>
          </div>
        </div>
      </div>

      <!-- System Prompt Settings -->
      <div class="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl">
        <h3 class="text-base font-bold text-white mb-2">System Prompts & Hướng dẫn AI</h3>
        <p class="text-xs text-gray-400 mb-4">Lời nhắc mặc định áp dụng cho tất cả các cuộc trò chuyện và trợ lý học tập</p>
        <textarea 
          v-model="systemPrompt" 
          rows="6" 
          class="w-full p-4 rounded-2xl bg-gray-900 border border-gray-700 text-xs font-mono text-gray-200 focus:outline-none focus:border-indigo-500"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useConfigStore } from '@/stores/config';

const configStore = useConfigStore();
const systemPrompt = ref(`Bạn là Đần AI — một trợ lý thông minh thân thiện, hài hước nhưng cực kỳ sâu sắc về công nghệ, lập trình và tiếng Anh IELTS.`);

const save = async () => {
  const res = await configStore.saveConfig({ system_prompt: systemPrompt.value });
  if (res.success) {
    alert('Đã lưu cấu hình thành công!');
  }
};

onMounted(() => {
  configStore.fetchConfig();
});
</script>
