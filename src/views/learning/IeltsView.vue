<template>
    <LearningLayout :error="taskManager.error.value" @retry="loadIelts">
        <section class="space-y-4 max-w-4xl mx-auto">
            <!-- Top Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-300 hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ IELTS" title="Đóng/mở công cụ">
                    <svg class="learning-tools-chevron w-5 h-5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="learning-tools-content">
                    <div class="learning-tools-content-inner space-y-3 px-1 pb-3 pt-1">
                        <div class="bg-gray-800/95 rounded-2xl border border-gray-600/80 p-2.5 shadow-lg flex items-center gap-2 overflow-x-auto">
                            <!-- Level Filter -->
                            <select v-model="taskManager.filterLevel.value" class="h-10 px-3 bg-gray-900 rounded-xl border border-gray-600 text-xs text-gray-200 font-semibold focus:outline-none focus:border-indigo-400 shrink-0">
                                <option value="">Tất cả Trình độ (IELTS)</option>
                                <option value="Band 6.0-7.0">Band 6.0 - 7.0</option>
                                <option value="Band 7.5-9.0">Band 7.5 - 9.0</option>
                                <option value="Academic">Academic</option>
                                <option value="General">General Training</option>
                            </select>

                            <!-- Search -->
                            <div class="relative flex-1 min-w-[200px]">
                                <input v-model="taskManager.searchQuery.value" placeholder="Tìm kiếm đề thi IELTS, từ khóa..." class="h-10 w-full pl-8 pr-7 bg-gray-900 rounded-xl border border-gray-600 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                                <button v-if="taskManager.searchQuery.value" @click="taskManager.searchQuery.value = ''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                            </div>

                            <!-- Count badge -->
                            <span class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-900 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 shrink-0">
                                {{ taskManager.filteredItems.value.length }} đề thi
                            </span>

                            <!-- AI Generator -->
                            <button @click="aiGeneratorOpen = true" class="h-10 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
                                <span>AI Tạo Đề</span>
                            </button>
                        </div>
                    </div>
                </div>
            </details>

            <!-- Loading -->
            <div v-if="taskManager.loading.value" class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                <span>Đang tải danh sách đề thi IELTS...</span>
            </div>

            <!-- Centered Studio Card -->
            <div v-else-if="activeIelts" class="studio-card space-y-4 sm:space-y-5">
                <!-- Header -->
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(activeIelts.level)]">
                            <i class="fa-solid fa-graduation-cap text-[10px] mr-1"></i>
                            <span>{{ activeIelts.level || "IELTS" }}</span>
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-mono font-semibold uppercase"> IELTS Preparation </span>
                        <button @click="taskManager.drawerOpen.value = true" class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700/60 transition flex items-center gap-1.5 shadow-sm" title="Bấm để mở danh sách chọn đề thi">
                            <i class="fa-solid fa-bullseye text-xs"></i>
                            <span>Đề {{ taskManager.currentIndex.value + 1 }} / {{ taskManager.filteredItems.value.length }}</span>
                            <i class="fa-solid fa-caret-down text-[10px]"></i>
                        </button>
                    </div>

                    <div class="flex items-center gap-2">
                        <button @click="copyPromptText" class="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs transition flex items-center gap-1.5" title="Sao chép đề bài">
                            <i :class="clipboard.copied.value ? 'fa-solid fa-check text-emerald-600' : 'fa-solid fa-copy'"></i>
                            <span class="hidden sm:inline">{{ clipboard.copied.value ? "Đã chép" : "Sao chép" }}</span>
                        </button>
                    </div>
                </div>

                <!-- Title -->
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                    {{ activeIelts.title }}
                </h1>

                <!-- Prompt Requirements Details -->
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-5 sm:p-6 space-y-2.5 shadow-sm">
                    <h3 class="text-xs sm:text-sm font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-list-check text-xs"></i>
                        <span>Yêu Cầu Đề Bài IELTS</span>
                    </h3>
                    <p class="whitespace-pre-wrap text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed pl-6 font-normal">{{ activeIelts.prompt }}</p>
                </div>

                <!-- Submission editor -->
                <div class="space-y-2">
                    <label class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <i class="fa-solid fa-pen-nib text-xs text-indigo-600"></i>
                        <span>Bài làm IELTS của bạn:</span>
                    </label>
                    <textarea v-model="ieltsSubmission" rows="10" class="input-control text-sm sm:text-base leading-relaxed" placeholder="Nhập bài làm IELTS của bạn để AI Examiner chấm theo 4 tiêu chí Band Descriptors..."></textarea>
                </div>

                <!-- Action Button -->
                <div class="flex items-center gap-3">
                    <button @click="evaluate" :disabled="evaluator.isEvaluating.value" class="primary-button px-6 py-2.5 flex items-center gap-2">
                        <i class="fa-solid fa-robot"></i>
                        <span>{{ evaluator.isEvaluating.value ? "Đang chấm điểm..." : "AI Examiner Chấm Band (0.0 - 9.0)" }}</span>
                    </button>
                </div>

                <!-- Feedback card -->
                <FeedbackCard v-if="evaluator.feedback.value" :feedback="evaluator.feedback.value" title="IELTS Band Assessment" />

                <!-- Bottom Navigation Bar Component -->
                <ItemNavControls
                    :current-index="taskManager.currentIndex.value"
                    :total-items="taskManager.filteredItems.value.length"
                    label="Đề"
                    drawer-icon="fa-solid fa-graduation-cap"
                    @prev="taskManager.moveIndex(-1)"
                    @next="taskManager.moveIndex(1)"
                    @random="taskManager.randomItem"
                    @open-drawer="taskManager.drawerOpen.value = true"
                />
            </div>

            <div v-else class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-box-open text-gray-400"></i>
                <span>Chưa có đề IELTS nào phù hợp với bộ lọc hiện tại.</span>
            </div>

            <!-- Polymorphic Item Drawer Modal -->
            <ItemDrawerModal
                :is-open="taskManager.drawerOpen.value"
                title="Danh Sách Đề Thi IELTS Preparation"
                icon="fa-solid fa-graduation-cap"
                :items="taskManager.filteredDrawerItems.value"
                :active-index="taskManager.currentIndex.value"
                :search-query="taskManager.drawerSearch.value"
                search-placeholder="Tìm đề thi IELTS trong danh sách..."
                badge-key="level"
                @close="taskManager.drawerOpen.value = false"
                @select="taskManager.selectDrawerItem"
                @update:search-query="taskManager.drawerSearch.value = $event"
            />

            <!-- AI Generator Modal -->
            <AIGeneratorModal :is-open="aiGeneratorOpen" type="ielts" @close="aiGeneratorOpen = false" @generated="loadIelts" />
        </section>
    </LearningLayout>
</template>

<script setup>
import { onMounted, ref } from "vue"
import LearningLayout from "@/layouts/LearningLayout.vue"
import FeedbackCard from "@/components/learning/FeedbackCard.vue"
import AIGeneratorModal from "@/components/learning/AIGeneratorModal.vue"
import ItemDrawerModal from "@/components/learning/ItemDrawerModal.vue"
import ItemNavControls from "@/components/learning/ItemNavControls.vue"
import { getLearningItems } from "@/api/learning"
import { getLevelBadgeClass } from "@/composables/useLearningHelper"
import { useTaskManager } from "@/composables/useTaskManager"
import { useClipboard } from "@/composables/useClipboard"
import { useAIEvaluator } from "@/composables/useAIEvaluator"

const ieltsSubmission = ref("")
const aiGeneratorOpen = ref(false)

const clipboard = useClipboard()
const evaluator = useAIEvaluator("ielts")

const taskManager = useTaskManager({
    fetchFn: (params) => getLearningItems({ category: "english", type: "ielts", limit: 100, ...params }),
    onIndexChange: () => {
        ieltsSubmission.value = ""
        evaluator.resetEvaluation()
    },
})

const activeIelts = taskManager.activeItem

const loadIelts = () => taskManager.loadTasks()

const copyPromptText = () => {
    const p = activeIelts.value
    if (!p) return
    clipboard.copy(`${p.title}\n\n${p.prompt}`)
}

const evaluate = async () => {
    try {
        await evaluator.evaluate(activeIelts.value?.id, ieltsSubmission.value)
    } catch (_) {}
}

onMounted(() => {
    loadIelts()
})
</script>
