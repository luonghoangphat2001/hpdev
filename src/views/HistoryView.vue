<template>
    <div id="page-history" class="h-full overflow-y-auto touch-scroll">
        <div class="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2.5 text-gray-900 dark:text-white">
                    <i class="fa-solid fa-clock-rotate-left text-indigo-600 dark:text-indigo-400"></i>
                    <span>Lịch sử Hội thoại</span>
                </h1>
                <button @click="load(true)" class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium border border-gray-300 dark:border-gray-700 transition flex items-center gap-1.5">
                    <i class="fa-solid fa-rotate text-xs"></i>
                    <span>Làm mới</span>
                </button>
            </div>
            <div v-if="loading && !history.length" class="text-gray-500 dark:text-gray-400 text-sm py-8 text-center flex items-center justify-center gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                <span>Đang tải…</span>
            </div>
            <p v-else-if="!history.length" class="text-gray-500 text-center py-8">Chưa có tin nhắn nào.</p>
            <div v-else class="space-y-2.5 text-xs sm:text-sm">
                <article v-for="item in history" :key="item.id" class="flex gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                    <span class="shrink-0 font-semibold flex items-center gap-1.5" :class="item.role === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'">
                        <i :class="item.role === 'user' ? 'fa-solid fa-user' : 'fa-solid fa-robot'" class="text-xs"></i>
                        <span>{{ item.role === "user" ? item.username || "User" : "Đần" }}</span>
                    </span>
                    <span class="text-gray-800 dark:text-gray-200 break-words min-w-0 text-sm whitespace-pre-wrap">{{ item.content }}</span>
                    <span class="ml-auto shrink-0 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">{{ formatDate(item.created_at) }}</span>
                </article>
            </div>
            <button v-if="hasMore" @click="load(false)" :disabled="loading" class="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold text-indigo-600 dark:text-indigo-300 disabled:opacity-50 transition">{{ loading ? "Đang tải…" : "Tải thêm" }}</button>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import { getHistory } from "@/api/stats"
const history = ref([]),
    loading = ref(false),
    hasMore = ref(true)
const limit = 50
const load = async (reset = false) => {
    loading.value = true
    try {
        const offset = reset ? 0 : history.value.length
        const rows = await getHistory(limit, offset)
        history.value = reset ? rows || [] : history.value.concat(rows || [])
        hasMore.value = (rows || []).length === limit
    } finally {
        loading.value = false
    }
}
const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—")
onMounted(() => load(true))
</script>
