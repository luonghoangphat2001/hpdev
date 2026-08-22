<template>
  <div class="h-full flex flex-col min-w-0">
    <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg">📊</span>
        <h2 class="text-sm font-bold text-white">Thống kê Sử dụng Tokens</h2>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 rounded-3xl bg-gray-800/90 border border-gray-700/80 shadow-xl">
          <span class="text-xs text-gray-400 font-semibold uppercase">Tổng số tin nhắn</span>
          <p class="text-2xl font-bold text-indigo-400 mt-1">{{ stats?.total_messages || 0 }}</p>
        </div>
        <div class="p-5 rounded-3xl bg-gray-800/90 border border-gray-700/80 shadow-xl">
          <span class="text-xs text-gray-400 font-semibold uppercase">Tổng Tokens đã dùng</span>
          <p class="text-2xl font-bold text-emerald-400 mt-1">{{ stats?.total_tokens || 0 }}</p>
        </div>
        <div class="p-5 rounded-3xl bg-gray-800/90 border border-gray-700/80 shadow-xl">
          <span class="text-xs text-gray-400 font-semibold uppercase">Ước tính chi phí</span>
          <p class="text-2xl font-bold text-amber-400 mt-1">${{ stats?.estimated_cost || '0.00' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getStats } from '@/api/stats';

const stats = ref(null);

onMounted(async () => {
  try {
    const res = await getStats();
    stats.value = res;
  } catch (_) {}
});
</script>
