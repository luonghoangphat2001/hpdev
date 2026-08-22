<template>
  <div class="h-full flex flex-col min-w-0">
    <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg">📋</span>
        <h2 class="text-sm font-bold text-white">Nhật ký Server Logs</h2>
      </div>
      <button @click="loadLogs" class="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded bg-gray-800">Làm mới</button>
    </header>

    <div class="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
      <div class="p-4 rounded-2xl bg-black border border-gray-800 font-mono text-xs text-gray-300 space-y-1 max-h-[650px] overflow-y-auto">
        <div v-for="(log, idx) in logs" :key="idx" class="leading-relaxed">
          <span class="text-indigo-400">[{{ log.time || 'INFO' }}]</span>
          <span class="ml-2">{{ log.message || log }}</span>
        </div>
        <div v-if="logs.length === 0" class="text-gray-500 text-center py-4">Chưa có logs ghi nhận.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getLogs } from '@/api/stats';

const logs = ref([]);

const loadLogs = async () => {
  try {
    const res = await getLogs(100);
    logs.value = res?.logs || [];
  } catch (_) {}
};

onMounted(() => {
  loadLogs();
});
</script>
