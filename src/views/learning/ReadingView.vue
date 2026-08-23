<template>
    <LearningLayout :error="taskManager.error.value" @retry="loadReading">
        <section class="space-y-4 max-w-4xl mx-auto">
            <!-- Top Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-400 hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ Đọc hiểu" title="Đóng/mở công cụ">
                    <svg class="learning-tools-chevron w-5 h-5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="learning-tools-content">
                    <div class="learning-tools-content-inner space-y-3 px-1 pb-3 pt-1">
                        <div class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 p-2.5 shadow-sm dark:shadow-md flex items-center gap-2 overflow-x-auto">
                            <!-- Level Filter -->
                            <select v-model="taskManager.filterLevel.value" class="h-10 px-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 font-semibold focus:outline-none focus:border-indigo-400 shrink-0">
                                <option value="">Tất cả Trình độ (CEFR)</option>
                                <option value="A2">A2 - Elementary</option>
                                <option value="B1">B1 - Intermediate</option>
                                <option value="B2">B2 - Upper Intermediate</option>
                                <option value="C1">C1 - Advanced</option>
                            </select>

                            <!-- Search -->
                            <div class="relative flex-1 min-w-[200px]">
                                <input v-model="taskManager.searchQuery.value" placeholder="Tìm kiếm bài đọc, chủ đề, từ khóa..." class="h-10 w-full pl-8 pr-7 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                                <button v-if="taskManager.searchQuery.value" @click="taskManager.searchQuery.value = ''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                            </div>

                            <!-- Count badge -->
                            <span class="text-xs font-mono font-bold text-gray-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-900 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 shrink-0">
                                {{ taskManager.filteredItems.value.length }} bài đọc
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
                <span>Đang tải danh sách bài đọc...</span>
            </div>

            <!-- Centered Studio Card -->
            <div v-else-if="activeReading" class="studio-card space-y-4 sm:space-y-5">
                <!-- Header -->
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(activeReading.level)]">
                            {{ activeReading.level || "B1" }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-mono font-semibold uppercase"> Reading Comprehension </span>
                        <button @click="taskManager.drawerOpen.value = true" class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700/60 transition flex items-center gap-1.5 shadow-sm" title="Bấm để mở danh sách chọn bài đọc">
                            <i class="fa-solid fa-book-open text-xs"></i>
                            <span>Bài {{ taskManager.currentIndex.value + 1 }} / {{ taskManager.filteredItems.value.length }}</span>
                            <i class="fa-solid fa-caret-down text-[10px]"></i>
                        </button>
                    </div>

                    <div class="flex items-center gap-2">
                        <button @click="copyPassageText" class="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs transition flex items-center gap-1.5" title="Sao chép bài đọc">
                            <i :class="clipboard.copied.value ? 'fa-solid fa-check text-emerald-600' : 'fa-solid fa-copy'"></i>
                            <span class="hidden sm:inline">{{ clipboard.copied.value ? "Đã chép" : "Sao chép" }}</span>
                        </button>
                    </div>
                </div>

                <!-- Title -->
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                    {{ activeReading.title }}
                </h1>

                <!-- Passage Body -->
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-5 sm:p-6 space-y-2.5 shadow-sm">
                    <div class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-book-open text-xs"></i>
                        <span>Đoạn Văn Đọc Hiểu (Reading Passage)</span>
                    </div>
                    <article class="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 pl-4 font-normal">
                        {{ activeReading.content?.passage || activeReading.prompt }}
                    </article>
                </div>

                <!-- Reading Questions -->
                <div v-if="activeReading.content?.questions?.length" class="space-y-3">
                    <h3 class="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-question text-xs"></i>
                        <span>Câu hỏi đọc hiểu & kiểm tra</span>
                    </h3>
                    <div class="space-y-2.5 pl-2 sm:pl-4">
                        <div v-for="(question, index) in activeReading.content.questions" :key="index" class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm sm:text-base text-slate-900 dark:text-slate-100 font-medium">
                            <b class="text-slate-950 dark:text-white">{{ index + 1 }}. {{ question.question || question }}</b>
                        </div>
                    </div>
                </div>

                <!-- Answer Submission -->
                <div class="space-y-2">
                    <label class="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                        <i class="fa-solid fa-pen-nib text-xs"></i>
                        <span>Câu trả lời của bạn:</span>
                    </label>
                    <textarea v-model="readingSubmission" rows="6" class="input-control text-sm sm:text-base leading-relaxed" placeholder="Nhập câu trả lời của bạn cho các câu hỏi trên..."></textarea>
                </div>

                <!-- Evaluate Button -->
                <div class="flex items-center gap-3">
                    <button @click="evaluate" :disabled="evaluator.isEvaluating.value" class="primary-button px-6 py-2.5 flex items-center gap-2">
                        <i class="fa-solid fa-robot"></i>
                        <span>{{ evaluator.isEvaluating.value ? "Đang chấm bài..." : "AI Chấm Đọc Hiểu" }}</span>
                    </button>
                </div>

                <!-- Feedback Card -->
                <FeedbackCard v-if="evaluator.feedback.value" :feedback="evaluator.feedback.value" title="Đánh Giá Đọc Hiểu" />

                <!-- Bottom Navigation Bar Component -->
                <ItemNavControls
                    :current-index="taskManager.currentIndex.value"
                    :total-items="taskManager.filteredItems.value.length"
                    label="Bài"
                    drawer-icon="fa-solid fa-book-open"
                    @prev="taskManager.moveIndex(-1)"
                    @next="taskManager.moveIndex(1)"
                    @random="taskManager.randomItem"
                    @open-drawer="taskManager.drawerOpen.value = true"
                />
            </div>

            <div v-else class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-box-open text-gray-400"></i>
                <span>Chưa có bài đọc nào phù hợp với bộ lọc hiện tại.</span>
            </div>

            <!-- Polymorphic Item Drawer Modal -->
            <ItemDrawerModal
                :is-open="taskManager.drawerOpen.value"
                title="Danh Sách Bài Đọc Hiểu"
                icon="fa-solid fa-book-open"
                :items="taskManager.filteredDrawerItems.value"
                :active-index="taskManager.currentIndex.value"
                :search-query="taskManager.drawerSearch.value"
                search-placeholder="Tìm bài đọc trong danh sách..."
                badge-key="level"
                @close="taskManager.drawerOpen.value = false"
                @select="taskManager.selectDrawerItem"
                @update:search-query="taskManager.drawerSearch.value = $event"
            />

            <!-- AI Generator Modal -->
            <AIGeneratorModal :is-open="aiGeneratorOpen" type="reading" @close="aiGeneratorOpen = false" @generated="loadReading" />
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

const readingSubmission = ref("")
const aiGeneratorOpen = ref(false)

const clipboard = useClipboard()
const evaluator = useAIEvaluator("reading")

const taskManager = useTaskManager({
    fetchFn: (params) => getLearningItems({ category: "english", type: "reading", limit: 100, ...params }),
    onIndexChange: () => {
        readingSubmission.value = ""
        evaluator.resetEvaluation()
    },
})

const activeReading = taskManager.activeItem

const loadReading = () => taskManager.loadTasks()

const copyPassageText = () => {
    const p = activeReading.value
    if (!p) return
    const text = `${p.title}\n\n${p.content?.passage || p.prompt}`
    clipboard.copy(text)
}

const evaluate = async () => {
    try {
        await evaluator.evaluate(activeReading.value?.id, readingSubmission.value)
    } catch (_) {}
}

onMounted(() => {
    loadReading()
})
</script>
