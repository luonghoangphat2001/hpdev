<template>
  <div class="h-full overflow-y-auto"><div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
    <div class="flex items-center justify-between"><h1 class="text-2xl font-bold">📜 History</h1><button @click="load(true)" class="text-sm text-indigo-400">↻ Refresh</button></div>
    <div v-if="loading && !history.length" class="text-gray-400 text-sm py-8 text-center">Đang tải…</div>
    <p v-else-if="!history.length" class="text-gray-500 text-center py-8">Chưa có tin nhắn nào.</p>
    <div v-else class="space-y-2"><article v-for="item in history" :key="item.id" class="flex gap-3 p-3 rounded-lg bg-gray-800">
      <span class="shrink-0 font-semibold" :class="item.role === 'user' ? 'text-blue-400' : 'text-amber-400'">{{ item.role === 'user' ? `👤 ${item.username || 'User'}` : '🤖 Đần' }}</span>
      <span class="text-gray-300 break-words min-w-0 text-sm whitespace-pre-wrap">{{ item.content }}</span>
      <span class="ml-auto shrink-0 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(item.created_at) }}</span>
    </article></div>
    <button v-if="hasMore" @click="load(false)" :disabled="loading" class="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-indigo-300 disabled:opacity-50">{{ loading ? 'Đang tải…' : 'Tải thêm' }}</button>
  </div></div>
</template>
<script setup>
import { ref, onMounted } from 'vue'; import { getHistory } from '@/api/stats';
const history=ref([]),loading=ref(false),hasMore=ref(true); const limit=50;
const load=async(reset=false)=>{loading.value=true;try{const offset=reset?0:history.value.length;const rows=await getHistory(limit,offset);history.value=reset?(rows||[]):history.value.concat(rows||[]);hasMore.value=(rows||[]).length===limit;}finally{loading.value=false;}};
const formatDate=(value)=>value?new Date(value).toLocaleString('vi-VN'):'—'; onMounted(()=>load(true));
</script>
