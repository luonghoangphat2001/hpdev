<template>
  <div class="relative inline-block text-left">
    <button 
      @click="isOpen = !isOpen"
      type="button"
      class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700/90 border border-gray-700 text-xs font-semibold text-gray-200 transition shadow-sm"
    >
      <span class="w-2 h-2 rounded-full" :class="activeColor"></span>
      <span>{{ activeLabel }}</span>
      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div 
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40"
    ></div>

    <div 
      v-if="isOpen"
      class="absolute left-0 mt-2 w-48 rounded-2xl bg-gray-800 border border-gray-700 shadow-2xl py-1 z-50 overflow-hidden"
    >
      <div class="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/60">
        Chọn Model AI
      </div>
      <button 
        v-for="m in models"
        :key="m.id"
        @click="selectModel(m.id)"
        class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left hover:bg-gray-700/80 transition"
        :class="chatStore.activeModel === m.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-200'"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :class="m.color"></span>
          <span>{{ m.name }}</span>
        </div>
        <span v-if="chatStore.activeModel === m.id" class="text-indigo-400 text-xs">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useChatStore } from '@/stores/chat';

const chatStore = useChatStore();
const isOpen = ref(false);

const models = [
  { id: 'gemini', name: 'Gemini 2.5 Flash', color: 'bg-emerald-400' },
  { id: 'claude', name: 'Claude 3.7 Sonnet', color: 'bg-amber-400' },
  { id: 'openai', name: 'GPT-4o Mini', color: 'bg-teal-400' },
];

const activeLabel = computed(() => {
  const found = models.find((m) => m.id === chatStore.activeModel);
  return found ? found.name : chatStore.activeModel;
});

const activeColor = computed(() => {
  const found = models.find((m) => m.id === chatStore.activeModel);
  return found ? found.color : 'bg-indigo-400';
});

const selectModel = (id) => {
  chatStore.setModel(id);
  isOpen.value = false;
};
</script>
