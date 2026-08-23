<template>
    <div id="page-stats" class="h-full overflow-y-auto touch-scroll">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2.5 text-gray-900 dark:text-white">
                <i class="fa-solid fa-chart-pie text-indigo-600 dark:text-indigo-400"></i>
                <span>Thống kê hoạt động</span>
            </h1>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div class="card">
                    <p class="value text-indigo-600 dark:text-indigo-400">{{ stats.total || 0 }}</p>
                    <span class="label">Total Messages</span>
                </div>
                <div class="card">
                    <p class="value text-emerald-600 dark:text-green-400">{{ stats.today || 0 }}</p>
                    <span class="label">Today</span>
                </div>
                <div class="card">
                    <p class="text-xl sm:text-2xl font-bold text-amber-600 dark:text-yellow-400 truncate px-1">{{ providerName }}</p>
                    <span class="label">Active Model</span>
                </div>
            </div>
            <section class="panel mb-4">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="title !mb-0 flex items-center gap-1.5">
                        <i class="fa-solid fa-bolt text-amber-500"></i>
                        <span>Sử dụng hôm nay</span>
                    </h2>
                    <span class="text-xs text-gray-500 font-mono">{{ new Date().toLocaleDateString("vi-VN") }}</span>
                </div>
                <TokenRows :rows="stats.todayByModel" />
                <p v-if="!stats.todayByModel?.length" class="empty">Chưa có dữ liệu hôm nay.</p>
            </section>
            <section class="panel mb-4">
                <h2 class="title flex items-center gap-1.5">
                    <i class="fa-solid fa-calendar-days text-indigo-500"></i>
                    <span>7 ngày gần nhất</span>
                </h2>
                <div v-for="(rows, day) in dailyGroups" :key="day" class="mb-4">
                    <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{{ day }}</div>
                    <TokenRows :rows="rows" compact />
                </div>
                <p v-if="!Object.keys(dailyGroups).length" class="empty">Chưa có dữ liệu.</p>
            </section>
            <section class="panel mb-4">
                <h2 class="title flex items-center gap-1.5">
                    <i class="fa-solid fa-comments text-indigo-500"></i>
                    <span>Tin nhắn theo nhóm Model / Provider</span>
                </h2>
                <div v-for="row in stats.byModel || []" :key="row.model" class="row flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300">
                        <i :class="modelIconClass(row.model)" class="w-4 text-center text-xs"></i>
                        <span>{{ label(row.model) }}</span>
                    </span>
                    <strong class="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">{{ row.count }} msgs</strong>
                </div>
                <p v-if="!stats.byModel?.length" class="empty">Chưa có dữ liệu.</p>
            </section>
            <section class="panel">
                <h2 class="title flex items-center gap-1.5">
                    <i class="fa-solid fa-coins text-amber-500"></i>
                    <span>Tổng lượng Token tiêu thụ (theo nhóm)</span>
                </h2>
                <TokenRows :rows="stats.tokensByModel" />
                <p v-if="!stats.tokensByModel?.length" class="empty">Chưa có dữ liệu.</p>
                <p class="text-[11px] sm:text-xs text-gray-500 mt-4 leading-relaxed">* Dữ liệu được tính từ lúc hệ thống bắt đầu ghi log.</p>
            </section>
        </div>
    </div>
</template>
<script setup>
import { computed, defineComponent, h, onMounted, ref } from "vue"
import { getStats } from "@/api/stats"
const stats = ref({})
const formatTokens = (n) => Intl.NumberFormat("vi-VN", { notation: Number(n) > 9999 ? "compact" : "standard" }).format(Number(n) || 0)
const label = (m) => String(m || "unknown").replace(/^models\//, "")
const modelIconClass = (m) => {
    const s = String(m || "").toLowerCase()
    if (s.includes("gemini")) return "fa-solid fa-wand-magic-sparkles text-indigo-500"
    if (s.includes("claude")) return "fa-solid fa-brain text-amber-500"
    if (s.includes("gpt")) return "fa-solid fa-robot text-emerald-500"
    if (s.includes("deepseek")) return "fa-solid fa-compass text-sky-500"
    return "fa-solid fa-microchip text-gray-400"
}
const providerName = computed(() => label(stats.value.activeModel || stats.value.active_model || "—"))
const dailyGroups = computed(() =>
    (stats.value.dailyUsage || []).reduce((all, row) => {
        const day = String(row.day).slice(0, 10)
        ;(all[day] ||= []).push(row)
        return all
    }, {}),
)
const TokenRows = defineComponent({
    props: { rows: Array, compact: Boolean },
    setup(p) {
        return () =>
            h(
                "div",
                { class: "space-y-3" },
                (p.rows || []).map((r) =>
                    h("div", { class: p.compact ? "row flex items-center justify-between" : "space-y-1" }, [
                        h("div", { class: "flex justify-between text-sm w-full" }, [
                            h("span", { class: "text-gray-800 dark:text-gray-300 flex items-center gap-1.5" }, [
                                h("i", { class: [modelIconClass(r.model), "text-xs w-4 text-center"] }),
                                h("span", label(r.model)),
                            ]),
                            h("span", { class: "text-amber-600 dark:text-yellow-400 font-semibold" }, `${formatTokens(Number(r.tokens_in || 0) + Number(r.tokens_out || 0))} · ${r.requests || 0} reqs`),
                        ]),
                        p.compact
                            ? null
                            : h("div", { class: "text-xs text-gray-500 flex items-center gap-3 pl-5" }, [
                                  h("span", { class: "flex items-center gap-1" }, [h("i", { class: "fa-solid fa-arrow-down text-[10px] text-emerald-500" }), `In: ${formatTokens(r.tokens_in)}`]),
                                  h("span", { class: "flex items-center gap-1" }, [h("i", { class: "fa-solid fa-arrow-up text-[10px] text-sky-500" }), `Out: ${formatTokens(r.tokens_out)}`]),
                              ]),
                    ]),
                ),
            )
    },
})
const load = async () => {
    stats.value = (await getStats()) || {}
}
onMounted(load)
</script>
<style scoped>
.card {
    @apply bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 text-center border border-gray-200 dark:border-gray-700/60 shadow-sm;
}
.label {
    @apply text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1;
}
.value {
    @apply text-2xl sm:text-3xl font-bold;
}
.panel {
    @apply bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/60 shadow-sm;
}
.title {
    @apply text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-300 mb-3;
}
.row {
    @apply flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700 last:border-0;
}
.empty {
    @apply text-gray-400 text-xs sm:text-sm;
}
</style>
