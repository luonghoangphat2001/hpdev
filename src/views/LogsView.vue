<template>
    <div id="page-logs" class="h-full overflow-y-auto touch-scroll">
        <div class="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2.5 text-gray-900 dark:text-white">
                    <i class="fa-solid fa-list-check text-indigo-600 dark:text-indigo-400"></i>
                    <span>Logs Hệ thống</span>
                </h1>
                <button @click="loadFiles" class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium border border-gray-300 dark:border-gray-700 transition flex items-center gap-1.5">
                    <i class="fa-solid fa-rotate text-xs"></i>
                    <span>Làm mới</span>
                </button>
            </div>
            <div class="flex gap-2 sm:gap-3 flex-wrap">
                <div v-for="file in files" :key="file.filename" class="flex items-center gap-1">
                    <button @click="open(file.filename)" class="px-3 py-1.5 rounded-xl text-xs font-mono border transition" :class="current === file.filename ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-white font-bold' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'">{{ file.filename }}</button>
                    <a :href="downloadUrl(file.filename)" :download="file.filename" class="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center" title="Tải log">
                        <i class="fa-solid fa-download text-xs"></i>
                    </a>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500">{{ size(file.sizeBytes) }}</span>
                </div>
                <span v-if="!files.length" class="text-xs text-gray-400 dark:text-gray-500">Không có file log nào.</span>
            </div>
            <section class="bg-gray-950 rounded-2xl border border-gray-700/60 overflow-hidden shadow-xl">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-4 py-2.5 bg-gray-900 border-b border-gray-800 gap-2">
                    <span class="text-xs text-gray-300 font-mono truncate">{{ current || "Chọn file bên trên để xem" }}</span>
                    <div class="flex items-center gap-2.5 self-end sm:self-auto">
                        <label class="flex items-center gap-1.5 text-xs text-gray-400"><input v-model="autoScroll" type="checkbox" class="accent-indigo-500" /> Auto-scroll</label><input v-model="filter" placeholder="Lọc log..." class="px-2.5 py-1 bg-gray-800 rounded-lg border border-gray-700 text-xs text-white w-32 sm:w-40 placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                    </div>
                </div>
                <pre ref="pre" class="text-xs text-gray-300 p-3 sm:p-4 overflow-auto h-[55vh] sm:h-[60vh] whitespace-pre-wrap break-all font-mono"><template v-for="(line,index) in filteredLines" :key="index"><span :class="lineClass(line)">{{ line }}</span>{{ '\n' }}</template></pre>
            </section>
        </div>
    </div>
</template>
<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { API_BASE } from "@/api/request"
import { getLogContent, getLogs } from "@/api/stats"
const files = ref([]),
    current = ref(""),
    raw = ref(""),
    filter = ref(""),
    autoScroll = ref(true),
    pre = ref(null)
const filteredLines = computed(() => raw.value.split("\n").filter((line) => !filter.value || line.toLowerCase().includes(filter.value.toLowerCase())))
const loadFiles = async () => {
    files.value = (await getLogs()) || []
    const today = `${new Date().toISOString().slice(0, 10)}.log`
    if (!current.value && files.value.some((f) => f.filename === today)) await open(today)
}
const open = async (filename) => {
    current.value = filename
    raw.value = await getLogContent(filename)
}
const downloadUrl = (f) => `${API_BASE}/logs/${encodeURIComponent(f)}`
const size = (b) => (!Number.isFinite(b) ? "" : b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`)
const lineClass = (l) => (/\[ERROR\]/.test(l) ? "text-red-400" : /\[WARN\]/.test(l) ? "text-yellow-400" : /\[INFO\]/.test(l) ? "text-green-400" : /\[OpenClaw\]/.test(l) ? "text-cyan-400" : "text-gray-300")
watch([filteredLines, autoScroll], async () => {
    if (autoScroll.value) {
        await nextTick()
        if (pre.value) pre.value.scrollTop = pre.value.scrollHeight
    }
})
onMounted(loadFiles)
</script>
