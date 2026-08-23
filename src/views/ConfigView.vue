<template>
    <div id="page-config" class="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 touch-scroll transition-colors duration-200">
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
            <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
                        <span class="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-base sm:text-lg flex items-center justify-center">
                            <i class="fa-solid fa-gear"></i>
                        </span>
                        <span>Cấu hình Hệ thống</span>
                    </h1>
                    <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">Quản trị mô hình AI đa nền tảng, OpenClaw, Providers và Prompts</p>
                </div>
                <div class="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    <span v-if="saveMessage" class="text-xs font-medium px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm" :class="saveOk ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/60' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800/60'">
                        <i :class="saveOk ? 'fa-solid fa-check text-emerald-500' : 'fa-solid fa-circle-exclamation text-rose-500'"></i>
                        <span>{{ saveMessage }}</span>
                    </span>
                    <button @click="save" :disabled="saving" class="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition shadow-md flex items-center gap-2">
                        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'"></i>
                        <span>{{ saving ? "Đang lưu…" : "Lưu cấu hình" }}</span>
                    </button>
                </div>
            </header>

            <div v-if="activeTab === 'models'" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section v-for="platform in platforms" :key="platform.key" class="bg-white dark:bg-gray-800/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/60 shadow-sm space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h2 class="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                                <span class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-base text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <i :class="platform.iconClass"></i>
                                </span>
                                <span>{{ platform.title }}</span>
                            </h2>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ platform.description }}</p>
                        </div>
                        <div class="text-right shrink-0">
                            <span class="text-[11px] text-gray-400 block">Đang dùng</span><span class="text-sm font-bold" :class="platform.color">{{ providerName(form[platform.field]) }}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                        <button v-for="provider in providers" :key="`${platform.key}-${provider.key}`" @click="form[platform.field] = provider.key" class="p-3.5 rounded-xl font-semibold border-2 transition-all flex flex-col items-center justify-center gap-2 text-xs" :class="form[platform.field] === provider.key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-white shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-200'">
                            <i :class="provider.iconClass || getProviderIcon(provider.key)" class="text-xl text-indigo-600 dark:text-indigo-400"></i>
                            <span class="font-medium text-center truncate max-w-full">{{ provider.shortLabel || provider.label || provider.key }}</span>
                        </button>
                    </div>
                </section>
            </div>

            <div v-else-if="activeTab === 'providers'" class="space-y-6">
                <div class="grid md:grid-cols-2 gap-6">
                    <section class="panel">
                        <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            <i class="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
                            <span>Gemini Model</span>
                        </h2>
                        <p>Chọn phiên bản Google Gemini</p>
                        <select v-model="form.gemini_model" class="field">
                            <option v-for="model in modelOptions.gemini" :key="model.id" :value="model.id">{{ model.label }}</option>
                        </select>
                    </section>
                    <section class="panel">
                        <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            <i class="fa-solid fa-robot text-emerald-500"></i>
                            <span>ChatGPT Model</span>
                        </h2>
                        <p>Chọn phiên bản OpenAI GPT</p>
                        <select v-model="form.chatgpt_model" class="field">
                            <option v-for="model in modelOptions.chatgpt" :key="model.id" :value="model.id">{{ model.label }}</option>
                        </select>
                    </section>
                </div>
                <section class="panel">
                    <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        <i class="fa-solid fa-brain text-amber-500"></i>
                        <span>Claude Model & Base URL</span>
                    </h2>
                    <p>Cấu hình phiên bản Anthropic Claude và Proxy Endpoint.</p>
                    <div class="grid md:grid-cols-2 gap-4">
                        <label>
                            <span class="label">Phiên bản Claude</span>
                            <select v-model="form.claude_model" class="field">
                                <option v-for="model in modelOptions.claude" :key="model.id" :value="model.id">{{ model.label }}</option>
                            </select>
                        </label>
                        <label>
                            <span class="label">Claude Base URL (Proxy)</span>
                            <input v-model.trim="form.claude_base_url" type="url" class="field" placeholder="https://your-claude-proxy.example.com/" />
                        </label>
                    </div>
                </section>
                <section class="panel">
                    <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        <i class="fa-solid fa-cubes text-purple-500"></i>
                        <span>Model các Provider bổ sung</span>
                    </h2>
                    <p>Cấu hình phiên bản model cho từng provider (DeepSeek, Kimi, vLLM, Ollama, NVIDIA, Cloudflare).</p>
                    <div class="grid md:grid-cols-2 gap-4">
                        <label v-for="provider in additionalProviders" :key="provider.field">
                            <span class="label flex items-center gap-1.5">
                                <i :class="provider.iconClass" class="text-xs"></i>
                                <span>{{ provider.label }}</span>
                            </span>
                            <input v-model.trim="form[provider.field]" class="field" :placeholder="provider.placeholder" />
                        </label>
                    </div>
                </section>
            </div>

            <div v-else-if="activeTab === 'openclaw'" class="space-y-6">
                <section class="panel">
                    <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        <i class="fa-solid fa-robot text-sky-500"></i>
                        <span>Model từng OpenClaw Agent</span>
                    </h2>
                    <p>Chọn provider và model chính / fallback riêng cho 5 agent (R&D, Logistics, CFO, Operations, CSKH).</p>
                    <div class="space-y-4">
                        <div v-for="agent in agents" :key="agent.key" class="grid md:grid-cols-[180px_1fr_1fr] gap-3 items-end p-4 rounded-xl bg-gray-900/60 border border-gray-700">
                            <strong class="text-sm text-indigo-300">{{ agent.label }}</strong>
                            <label> <span class="label">Primary model</span><input v-model.trim="form[`agent_${agent.key}_primary`]" class="field" placeholder="provider:model" /></label><label><span class="label">Fallback model</span><input v-model.trim="form[`agent_${agent.key}_fallback`]" class="field" placeholder="provider:model" /></label>
                        </div>
                    </div>
                </section>
                <section class="panel">
                    <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        <i class="fa-solid fa-network-wired text-indigo-500"></i>
                        <span>OpenClaw Service Integration</span>
                    </h2>
                    <p>Tích hợp tìm kiếm Google Search và crawl tự động qua OpenClaw microservice.</p>
                    <div class="space-y-4">
                        <label class="flex items-center gap-3 cursor-pointer"><input v-model="form.openclaw_enabled" type="checkbox" class="w-4 h-4 accent-indigo-500" /><span class="text-sm text-gray-200 font-medium">Bật OpenClaw</span></label>
                        <div class="grid md:grid-cols-2 gap-4">
                            <label><span class="label">OpenClaw Base URL</span><input v-model.trim="form.openclaw_url" type="url" class="field" placeholder="https://your-openclaw.example.com" /></label><label><span class="label">Google Custom Search Engine ID (CX)</span><input v-model.trim="form.google_cx" class="field" placeholder="xxxxxxxxxxxxxxx:xxxxxxxxxx" /></label>
                        </div>
                    </div>
                </section>
            </div>

            <div v-else-if="activeTab === 'prompts'" class="space-y-6">
                <section class="panel">
                    <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        <i class="fa-solid fa-file-pen text-indigo-500"></i>
                        <span>System Persona Prompt</span>
                    </h2>
                    <p>Định hình tính cách, phong cách trả lời và ngữ cảnh hoạt động của bot.</p>
                    <textarea v-model="form.system_prompt" rows="5" class="field resize-y"></textarea>
                </section>
                <section class="panel space-y-4">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                                <i class="fa-solid fa-graduation-cap text-emerald-500"></i>
                                <span>Learning Hub — Tuỳ biến System Prompts AI</span>
                            </h2>
                            <p class="!mb-0">Tuỳ chỉnh System Prompt cho các chức năng sinh bài và chấm điểm; để trống để dùng mặc định.</p>
                        </div>
                        <button @click="fillAllPrompts" class="px-3 py-1.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-700 whitespace-nowrap flex items-center gap-1.5">
                            <i class="fa-solid fa-clipboard-list text-xs"></i>
                            <span>Nhập tất cả mẫu</span>
                        </button>
                    </div>
                    <label v-for="prompt in promptFields" :key="prompt.key" class="block">
                        <span class="flex items-center justify-between mb-1">
                            <b class="text-xs text-indigo-400 flex items-center gap-1.5">
                                <i :class="prompt.iconClass" class="text-xs"></i>
                                <span>{{ prompt.label }}</span>
                            </b>
                            <span class="flex gap-2">
                                <button type="button" @click="form[prompt.key] = prompt.template" class="text-xs text-indigo-400 underline flex items-center gap-1">
                                    <i class="fa-solid fa-paste text-[10px]"></i>
                                    <span>Nhập mẫu</span>
                                </button>
                                <button type="button" @click="form[prompt.key] = ''" class="text-xs text-gray-500">Xóa</button>
                            </span>
                        </span>
                        <textarea v-model="form[prompt.key]" rows="3" class="field text-xs font-mono" :placeholder="prompt.placeholder"></textarea>
                    </label>
                </section>
            </div>

            <div v-else class="space-y-6">
                <section class="panel space-y-4">
                    <div>
                        <h2 class="flex items-center gap-2 font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            <i class="fa-solid fa-receipt text-indigo-500"></i>
                            <span>Quản lý Log & Tự động dọn dẹp (Log Retention)</span>
                        </h2>
                        <p>Thiết lập thời gian lưu file log hệ thống. Hệ thống tự dọn các file cũ hơn số ngày cấu hình.</p>
                    </div>
                    <div class="grid sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <span class="label">Số ngày lưu trữ log</span>
                            <div class="flex items-center gap-2"><input v-model.number="form.log_retention_days" type="number" min="1" max="365" class="w-28 field text-center font-semibold" /><span class="text-xs text-gray-400">ngày</span></div>
                            <div class="flex items-center gap-1.5 mt-2.5">
                                <span class="text-[11px] text-gray-400">Chọn nhanh:</span><button v-for="days in [7, 14, 30, 60]" :key="days" @click="form.log_retention_days = days" class="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs border border-gray-600">{{ days }} ngày</button>
                            </div>
                        </div>
                        <div class="bg-gray-700/40 p-4 rounded-xl border border-gray-700 space-y-2">
                            <div class="flex items-center justify-between gap-3">
                                <span class="text-xs text-gray-300 font-medium">Dọn dẹp log thủ công:</span>
                                <button @click="cleanLogsNow" class="px-3.5 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                    <i class="fa-solid fa-trash-can text-xs"></i>
                                    <span>Dọn dẹp log cũ ngay</span>
                                </button>
                            </div>
                            <p v-if="cleanMessage" class="text-xs font-medium text-amber-300">{{ cleanMessage }}</p>
                        </div>
                    </div>
                </section>
            </div>

            <footer class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 pb-8 border-t border-gray-800">
                <p class="text-xs text-gray-500 text-center sm:text-left">Mọi thay đổi sẽ có hiệu lực ngay lập tức sau khi lưu.</p>
                <button @click="save" :disabled="saving" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-lg flex items-center justify-center gap-2">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Lưu toàn bộ cấu hình</span>
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getConfig, getModelsByProvider, updateConfig } from "@/api/config"
import { cleanLogs } from "@/api/stats"

const route = useRoute()
const router = useRouter()
const validTabs = ["models", "providers", "openclaw", "prompts", "logs"]
const activeTab = computed(() => (validTabs.includes(route.params.tab) ? route.params.tab : "models"))
watch(
    () => route.params.tab,
    (tab) => {
        if (!tab) router.replace("/config/models")
    },
    { immediate: true },
)
const fallbackProviders = [
    { key: "claude", shortLabel: "Claude", iconClass: "fa-solid fa-brain" },
    { key: "chatgpt", shortLabel: "ChatGPT", iconClass: "fa-solid fa-robot" },
    { key: "gemini", shortLabel: "Gemini", iconClass: "fa-solid fa-wand-magic-sparkles" },
]
const providers = ref(fallbackProviders)
const getProviderIcon = (key) => {
    const s = String(key || "").toLowerCase()
    if (s.includes("gemini")) return "fa-solid fa-wand-magic-sparkles"
    if (s.includes("claude")) return "fa-solid fa-brain"
    if (s.includes("chatgpt") || s.includes("gpt")) return "fa-solid fa-robot"
    if (s.includes("deepseek")) return "fa-solid fa-compass"
    return "fa-solid fa-microchip"
}
const modelOptions = reactive({ gemini: [], claude: [], chatgpt: [] })
const platforms = [
    { key: "discord", field: "discord_active_model", iconClass: "fa-brands fa-discord", title: "Discord Bot — Model Mặc Định", description: "Mô hình AI xử lý tin nhắn trực tiếp và lệnh trong server Discord", color: "text-indigo-400" },
    { key: "telegram", field: "telegram_active_model", iconClass: "fa-brands fa-telegram", title: "Telegram Bot — Model Mặc Định", description: "Mô hình AI xử lý tin nhắn chat và lệnh trong bot Telegram", color: "text-blue-400" },
    { key: "learning", field: "learning_active_model", iconClass: "fa-solid fa-graduation-cap", title: "Learning Hub — Model Mặc Định", description: "Dùng để sinh bài tập Tech, Vocab, Quiz và chấm điểm AI", color: "text-emerald-400" },
    { key: "web", field: "active_model", iconClass: "fa-solid fa-desktop", title: "Web Chat — Model Mặc Định", description: "Mô hình AI mặc định cho giao diện Web Dashboard Chat", color: "text-purple-400" },
]
const additionalProviders = [
    { field: "deepseek_model", label: "DeepSeek", iconClass: "fa-solid fa-compass text-sky-400", placeholder: "deepseek-v4-flash" },
    { field: "kimi_model", label: "Kimi", iconClass: "fa-solid fa-brain text-purple-400", placeholder: "kimi-k2.6" },
    { field: "vllm_model", label: "vLLM", iconClass: "fa-solid fa-bolt text-amber-400", placeholder: "llama3.1" },
    { field: "ollama_model", label: "Ollama", iconClass: "fa-solid fa-server text-emerald-400", placeholder: "llama3.1" },
    { field: "nvidia_model", label: "NVIDIA NIM", iconClass: "fa-solid fa-microchip text-green-400", placeholder: "meta/llama-3.1-8b-instruct" },
    { field: "cloudflare_model", label: "Cloudflare AI", iconClass: "fa-solid fa-cloud text-amber-400", placeholder: "@cf/meta/llama-3.1-8b-instruct" },
]
const agents = [
    { key: "dan_rnd", label: "R&D" },
    { key: "dan_logistics", label: "Logistics" },
    { key: "dan_cfo", label: "CFO" },
    { key: "dan_ops", label: "Operations" },
    { key: "dan_cskh", label: "CSKH" },
]
const promptFields = [
    ["learning_prompt_tech", "Tech Questions Prompt", "fa-solid fa-laptop-code", "Sinh câu hỏi cho 6 Tech Stacks"],
    ["learning_prompt_vocab", "Vocabulary Prompt", "fa-solid fa-book-open", "Sinh từ vựng 50 Topics"],
    ["learning_prompt_quiz", "Quiz Prompt", "fa-solid fa-puzzle-piece", "Soạn đề trắc nghiệm"],
    ["learning_prompt_reading", "Reading Comprehension Prompt", "fa-solid fa-book-open-reader", "Soạn bài đọc hiểu"],
    ["learning_prompt_writing", "Writing Studio Prompt", "fa-solid fa-pen-fancy", "Soạn đề luyện viết"],
    ["learning_prompt_speaking", "Speaking Prompt", "fa-solid fa-microphone-lines", "Kịch bản luyện nói"],
    ["learning_prompt_ielts", "IELTS Prep Prompt", "fa-solid fa-graduation-cap", "Đề thi IELTS"],
    ["learning_prompt_eval_tech", "Tech Mock Interview Evaluator", "fa-solid fa-robot", "AI chấm điểm Tech"],
    ["learning_prompt_eval_reading", "Reading Evaluator", "fa-solid fa-robot", "AI chấm đọc hiểu"],
    ["learning_prompt_eval_writing", "Writing Evaluator", "fa-solid fa-robot", "AI chấm và sửa bài viết"],
    ["learning_prompt_eval_speaking", "Speaking Evaluator", "fa-solid fa-robot", "AI chấm bài nói"],
    ["learning_prompt_eval_ielts", "IELTS Evaluator", "fa-solid fa-robot", "AI chấm IELTS"],
].map(([key, label, iconClass, placeholder]) => ({ key, label, iconClass, placeholder, template: `Bạn là chuyên gia ${label}. Hãy xử lý {{count}} nội dung cho {{topicName}} ở cấp độ {{level}} và chỉ trả về JSON đúng schema Learning.` }))
const form = reactive({ active_model: "gemini", learning_active_model: "gemini", discord_active_model: "claude", telegram_active_model: "gemini", gemini_model: "models/gemini-2.5-flash", claude_model: "claude-sonnet-4-6", chatgpt_model: "gpt-4o", claude_base_url: "", system_prompt: "", openclaw_enabled: true, openclaw_url: "", google_cx: "", log_retention_days: 14 })
for (const item of additionalProviders) form[item.field] = ""
for (const agent of agents) {
    form[`agent_${agent.key}_primary`] = ""
    form[`agent_${agent.key}_fallback`] = ""
}
for (const prompt of promptFields) form[prompt.key] = ""
const saving = ref(false),
    saveMessage = ref(""),
    saveOk = ref(false),
    cleanMessage = ref("")
const providerName = (key) => providers.value.find((p) => (p.key || p.id) === key)?.display || providers.value.find((p) => (p.key || p.id) === key)?.label || key
const normalizeModels = (rows) => (rows || []).map((model) => (typeof model === "string" ? { id: model, label: model } : { id: model.id || model.value, label: model.label || model.name || model.id || model.value }))
const ensureModel = (provider, value) => {
    if (value && !modelOptions[provider].some((model) => model.id === value)) modelOptions[provider].push({ id: value, label: value })
}
const load = async () => {
    const [config, ...models] = await Promise.all([getConfig(), ...["gemini", "claude", "chatgpt"].map((p) => getModelsByProvider(p).catch(() => ({ models: [] })))])
    providers.value = config.ai_providers?.length ? config.ai_providers.map((p) => ({ ...p, key: p.key || p.id })) : fallbackProviders
    Object.keys(form).forEach((key) => {
        if (config[key] !== undefined) form[key] = key === "openclaw_enabled" ? String(config[key]) === "true" : config[key]
    })
    ;["gemini", "claude", "chatgpt"].forEach((provider, index) => {
        modelOptions[provider] = normalizeModels(models[index]?.models)
        ensureModel(provider, form[`${provider}_model`])
    })
}
const save = async () => {
    saving.value = true
    saveMessage.value = ""
    try {
        await updateConfig({ ...form, openclaw_enabled: form.openclaw_enabled ? "true" : "false" })
        saveMessage.value = "Đã lưu!"
        saveOk.value = true
        setTimeout(() => (saveMessage.value = ""), 2500)
    } catch (error) {
        saveMessage.value = error.message
        saveOk.value = false
    } finally {
        saving.value = false
    }
}
const fillAllPrompts = () =>
    promptFields.forEach((prompt) => {
        form[prompt.key] = prompt.template
    })
const cleanLogsNow = async () => {
    try {
        const res = await cleanLogs(form.log_retention_days)
        cleanMessage.value = `Đã dọn ${res.deletedCount || 0} file log cũ (> ${res.retentionDays || form.log_retention_days} ngày)`
    } catch (error) {
        cleanMessage.value = error.message
    }
}
onMounted(load)
</script>

<style scoped>
.panel {
    @apply bg-white dark:bg-gray-800/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/60 shadow-sm;
}
.panel h2 {
    @apply font-bold mb-1 text-gray-900 dark:text-gray-100 text-sm sm:text-base;
}
.panel p {
    @apply text-xs text-gray-500 dark:text-gray-400 mb-4;
}
.label {
    @apply block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1;
}
.field {
    @apply w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition;
}
</style>
