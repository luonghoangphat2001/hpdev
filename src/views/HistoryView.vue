<template>
  <div class="h-full flex flex-col min-w-0">
    <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg">📜</span>
        <h2 class="text-sm font-bold text-white">Lịch sử Hội thoại AI</h2>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
      <div 
        v-for="(item, idx) in history" 
        :key="idx"
        class="p-4 rounded-2xl bg-gray-800/90 border border-gray-700/80 space-y-2 shadow-md"
      >
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span class="font-mono">{{ item.username || 'User' }}</span>
          <span class="font-mono text-[10px]">{{ item.created_at || 'Gần đây' }}</span>
        </div>
        <p class="text-sm font-semibold text-white">{{ item.message }}</p>
        <p class="text-xs text-gray-300 bg-gray-900 p-3 rounded-xl whitespace-pre-wrap">{{ item.response }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getHistory } from '@/api/stats';

const history = ref([]);

onMounted(async () => {
  try {
    const res = await getHistory(50);
    history.value = res?.history || [];
  } catch (_) {}
});
</script>
