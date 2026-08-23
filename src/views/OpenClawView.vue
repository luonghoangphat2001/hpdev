<template>
    <div id="page-openclaw" class="h-full overflow-y-auto touch-scroll">
        <div class="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
            <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2.5 text-gray-900 dark:text-white">
                        <i class="fa-solid fa-robot text-indigo-600 dark:text-indigo-400"></i>
                        <span>OpenClaw Monitor</span>
                    </h1>
                    <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Trạng thái điều phối 5 Đần và các luồng đang xử lý</p>
                </div>
                <button @click="load" class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium border border-gray-300 dark:border-gray-700 flex items-center gap-1.5">
                    <i class="fa-solid fa-rotate text-xs"></i>
                    <span>Làm mới</span>
                </button>
            </div>
            <p v-if="error" class="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{{ error }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                <div v-for="card in overviewCards" :key="card.label" class="bg-white dark:bg-gray-800/90 rounded-2xl p-3.5 sm:p-4 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                    <div class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</div>
                    <div class="mt-1.5 text-base sm:text-lg font-semibold truncate" :class="card.color">{{ card.value }}</div>
                </div>
            </div>

            <section>
                <div class="flex justify-between mb-3">
                    <div>
                        <h2 class="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-200">5 Đần chuyên trách</h2>
                        <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dữ liệu workflow thật từ OpenClaw</p>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ agents.length }} agents</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    <article v-for="agent in agents" :key="agent.agentId" class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                        <div class="flex justify-between gap-2">
                            <strong class="text-gray-900 dark:text-white">{{ agent.displayName || agent.agentId }}</strong
                            ><span class="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-gray-900 text-emerald-700 dark:text-green-300 font-medium border border-emerald-200 dark:border-gray-700">{{ agent.lifecycleStatus || agent.status }}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-2">{{ agent.agentId }} · v{{ agent.stateVersion || 0 }}</div>
                        <div class="flex flex-wrap gap-1 mt-3">
                            <button v-for="action in lifecycleActions(agent)" :key="action.state" @click="control(agent, action.state)" class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:border-indigo-500 text-gray-700 dark:text-gray-200">{{ action.label }}</button>
                        </div>
                    </article>
                    <p v-if="!agents.length" class="text-sm text-gray-500">Không tải được agent.</p>
                </div>
            </section>

            <section class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 class="font-bold text-gray-900 dark:text-white mr-auto">Workflows</h2>
                    <input v-model.trim="filters.search" @input="scheduleFilter" placeholder="Tìm workflow…" class="filter" /><input v-model.trim="filters.agentId" @input="scheduleFilter" placeholder="Agent ID" class="filter" /><select v-model="filters.state" @change="loadWorkflows" class="filter">
                        <option value="">All states</option>
                        <option>running</option>
                        <option>awaiting_approval</option>
                        <option>completed</option>
                        <option>failed</option>
                        <option>paused</option>
                    </select>
                </div>
                <button v-for="flow in workflows" :key="flow.workflowId" @click="openWorkflow(flow.workflowId)" class="w-full text-left px-5 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                    <div class="flex items-center gap-2">
                        <strong class="font-mono text-sm text-gray-900 dark:text-white">{{ flow.workflowId }}</strong
                        ><span class="badge">{{ flow.state }}</span
                        ><span class="badge">{{ flow.riskLevel }}</span
                        ><span class="ml-auto text-xs text-gray-500">{{ formatDate(flow.updatedAt) }}</span>
                    </div>
                    <div class="mt-2 text-xs text-gray-400">{{ flow.assignedAgentId || "unassigned" }} · {{ flow.workflowType }} · priority {{ flow.priority }}</div>
                </button>
                <p v-if="!workflows.length" class="p-5 text-sm text-gray-500">Không có workflow phù hợp.</p>
            </section>

            <section v-if="workflowDetail" class="bg-gray-850 border border-indigo-500/40 rounded-xl p-5">
                <div class="flex justify-between">
                    <h2 class="font-semibold">Timeline · {{ workflowDetail.workflow?.workflowId }}</h2>
                    <button @click="workflowDetail = null" class="text-xs text-gray-400">Đóng</button>
                </div>
                <div class="grid md:grid-cols-3 gap-3 mt-4 text-xs">
                    <div class="detail">
                        State<br /><strong>{{ workflowDetail.workflow?.state }}</strong>
                    </div>
                    <div class="detail">
                        Risk<br /><strong>{{ workflowDetail.workflow?.riskLevel }}</strong>
                    </div>
                    <div class="detail">
                        Agent<br /><strong>{{ workflowDetail.workflow?.assignedAgentId || "unassigned" }}</strong>
                    </div>
                </div>
                <div class="mt-4 space-y-2">
                    <article v-for="(event, index) in workflowEvents" :key="event.eventId || index" class="border-l-2 border-indigo-500 pl-3 text-xs">
                        <strong>{{ event.eventType || event.type || event.state }}</strong>
                        <div class="text-gray-500">{{ formatDate(event.createdAt || event.occurredAt || event.timestamp) }}</div>
                    </article>
                </div>
            </section>

            <section class="bg-gray-800 rounded-xl overflow-hidden">
                <div class="p-4 border-b border-gray-700 flex justify-between">
                    <h2 class="font-semibold">OpenClaw tool history</h2>
                    <span class="text-xs text-gray-500">{{ Math.min(logs.length, totalLogs) }} / {{ totalLogs }}</span>
                </div>
                <article v-for="log in logs" :key="log.id" class="p-4 border-b border-gray-700 space-y-2">
                    <div class="flex gap-2 text-xs">
                        <span class="badge">{{ log.query_type }}</span
                        ><span class="text-indigo-400">{{ log.platform }}</span
                        ><strong>{{ log.username }}</strong
                        ><span class="ml-auto text-gray-500">{{ log.created_at }}</span>
                    </div>
                    <div class="text-sm text-yellow-200">{{ log.query }}</div>
                    <details class="text-xs">
                        <summary class="cursor-pointer text-gray-400">Kết quả OpenClaw</summary>
                        <pre class="mt-2 whitespace-pre-wrap bg-gray-900 p-3 rounded">{{ log.result_preview }}</pre>
                    </details>
                    <details class="text-xs">
                        <summary class="cursor-pointer text-gray-400">AI tóm tắt</summary>
                        <div class="mt-2 bg-gray-900 p-3 rounded">{{ log.ai_summary }}</div>
                    </details>
                </article>
                <button v-if="logs.length < totalLogs" @click="loadMore" class="w-full p-3 text-sm text-indigo-400">Tải thêm</button>
            </section>
        </div>
    </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from "vue"
import { controlOpenClawAgent, getOpenClawAgents, getOpenClawLogs, getOpenClawOverview, getOpenClawWorkflow, getOpenClawWorkflows } from "@/api/stats"
const overview = ref({}),
    agents = ref([]),
    workflows = ref([]),
    workflowDetail = ref(null),
    logs = ref([]),
    totalLogs = ref(0),
    error = ref(""),
    filters = reactive({ search: "", agentId: "", state: "" })
let timer
const overviewCards = computed(() => {
    const o = overview.value?.overview || {},
        c = o.operationalCounts || {}
    return [
        { label: "Orchestrator", value: o.status || "OFFLINE", color: o.status === "UP" ? "text-green-300" : "text-red-300" },
        { label: "Production gate", value: o.productionEnabled ? "ON" : "LOCKED", color: o.productionEnabled ? "text-green-300" : "text-amber-300" },
        { label: "Workflow hoạt động", value: c.activeWorkflowCount || 0, color: "text-cyan-300" },
        { label: "Chờ CEO duyệt", value: c.pendingApprovalCount || 0, color: "text-amber-300" },
        { label: "Dead letter chưa xử lý", value: c.unresolvedDeadLetterCount || 0, color: "text-red-300" },
        { label: "CEO exception mở", value: c.openExceptionCount || 0, color: "text-fuchsia-300" },
    ]
})
const loadWorkflows = async () => {
    const r = await getOpenClawWorkflows(filters)
    workflows.value = r?.workflows || []
}
const load = async () => {
    error.value = ""
    const results = await Promise.allSettled([getOpenClawOverview(), getOpenClawAgents(), getOpenClawWorkflows(filters), getOpenClawLogs(30, 0)])
    if (results[0].status === "fulfilled") overview.value = results[0].value
    else error.value = "Không thể kết nối control-plane OpenClaw."
    if (results[1].status === "fulfilled") agents.value = results[1].value?.agents || []
    if (results[2].status === "fulfilled") workflows.value = results[2].value?.workflows || []
    if (results[3].status === "fulfilled") {
        logs.value = results[3].value?.logs || []
        totalLogs.value = Number(results[3].value?.total || 0)
    }
}
const scheduleFilter = () => {
    clearTimeout(timer)
    timer = setTimeout(loadWorkflows, 250)
}
const openWorkflow = async (id) => {
    workflowDetail.value = (await getOpenClawWorkflow(id))?.detail || null
}
const workflowEvents = computed(() => workflowDetail.value?.timeline || workflowDetail.value?.events || workflowDetail.value?.history || [])
const loadMore = async () => {
    const r = await getOpenClawLogs(30, logs.value.length)
    logs.value.push(...(r?.logs || []))
}
const formatDate = (v) => (v ? new Date(v).toLocaleString("vi-VN") : "—")
const actions = {
    ACTIVE: [
        ["Tạm dừng", "PAUSED"],
        ["Cách ly", "QUARANTINED"],
    ],
    PAUSED: [
        ["Tiếp tục", "ACTIVE"],
        ["Đình chỉ", "SUSPENDED"],
    ],
    SUSPENDED: [
        ["Tiếp tục", "ACTIVE"],
        ["Sửa lỗi", "FIXING"],
    ],
    QUARANTINED: [["Sửa lỗi", "FIXING"]],
    FIXING: [["Chuyển test", "TESTING"]],
    TESTING: [
        ["Canary", "CANARY"],
        ["Kích hoạt", "ACTIVE"],
    ],
    CANARY: [
        ["Kích hoạt", "ACTIVE"],
        ["Cách ly", "QUARANTINED"],
    ],
}
const lifecycleActions = (a) => (actions[a.lifecycleStatus] || []).map(([label, state]) => ({ label, state }))
const control = async (a, state) => {
    const reason = prompt(`Lý do chuyển ${a.agentId} sang ${state}:`)
    if (!reason?.trim() || !confirm(`Xác nhận chuyển ${a.agentId} sang ${state}?`)) return
    await controlOpenClawAgent(a.agentId, { toState: state, expectedVersion: a.stateVersion, reason: reason.trim() })
    await load()
}
onMounted(load)
</script>
<style scoped>
.filter {
    @apply px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500;
}
.badge {
    @apply px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-[10px] font-mono border border-gray-200 dark:border-gray-700;
}
.detail {
    @apply rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700;
}
.detail strong {
    @apply text-gray-900 dark:text-white;
}
</style>
