<template>
    <div class="h-full flex flex-col min-w-0">
        <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
                <span class="text-lg">🕷️</span>
                <h2 class="text-sm font-bold text-white">OpenClaw Crawler & Agent Monitor</h2>
            </div>
            <a href="https://openclaw.hpdev.name.vn" target="_blank" class="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                <span>Mở OpenClaw Portal</span>
                <span>↗</span>
            </a>
        </header>

        <div class="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="p-5 rounded-3xl bg-gray-800/90 border border-gray-700/80 shadow-xl">
                    <span class="text-xs text-gray-400 font-semibold uppercase">Trạng thái Worker</span>
                    <p class="text-xl font-bold text-emerald-400 mt-1">● Đang hoạt động</p>
                    <span class="text-[10px] text-gray-500 font-mono">Playwright Headless Chrome</span>
                </div>

                <div class="p-5 rounded-3xl bg-gray-800/90 border border-gray-700/80 shadow-xl">
                    <span class="text-xs text-gray-400 font-semibold uppercase">Database</span>
                    <p class="text-xl font-bold text-indigo-400 mt-1">dan_ai</p>
                    <span class="text-[10px] text-gray-500 font-mono">17 Workflows & Event Tables</span>
                </div>

                <div class="p-5 rounded-3xl bg-gray-800/90 border border-gray-700/80 shadow-xl">
                    <span class="text-xs text-gray-400 font-semibold uppercase">Tổng lượt cào</span>
                    <p class="text-xl font-bold text-amber-400 mt-1">{{ logs.length }} logs</p>
                    <span class="text-[10px] text-gray-500 font-mono">Lịch sử sự kiện gần nhất</span>
                </div>
            </div>

            <!-- Logs Table -->
            <div class="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl overflow-hidden">
                <h3 class="text-base font-bold text-white mb-4">Nhật Ký Tác Vụ Cào Web Gần Đây</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead class="border-b border-gray-700 text-gray-400">
                            <tr>
                                <th class="pb-3 font-semibold">Thời gian</th>
                                <th class="pb-3 font-semibold">Loại</th>
                                <th class="pb-3 font-semibold">Truy vấn / URL</th>
                                <th class="pb-3 font-semibold">Tóm tắt AI</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700/50 text-gray-200">
                            <tr v-for="(log, idx) in logs" :key="idx">
                                <td class="py-3 font-mono text-[10px] text-gray-400">{{ log.created_at || "Vừa xong" }}</td>
                                <td class="py-3">
                                    <span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                                        {{ log.query_type || "crawl" }}
                                    </span>
                                </td>
                                <td class="py-3 font-mono max-w-[200px] truncate text-gray-300">{{ log.query }}</td>
                                <td class="py-3 max-w-[300px] truncate text-gray-400">{{ log.ai_summary || log.result_preview }}</td>
                            </tr>
                            <tr v-if="logs.length === 0">
                                <td colspan="4" class="py-6 text-center text-gray-500">Chưa có tác vụ cào nào gần đây.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { getOpenClawLogs } from "@/api/stats"

const logs = ref([])

onMounted(async () => {
    try {
        const res = await getOpenClawLogs(50)
        logs.value = res?.logs || []
    } catch (_) {}
})
</script>
