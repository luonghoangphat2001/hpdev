<template>
    <LearningLayout :error="taskManager.error.value" @retry="loadWriting">
        <section class="space-y-4 max-w-4xl mx-auto">
            <!-- Top Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-300 hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ Luyện viết" title="Đóng/mở công cụ">
                    <svg class="learning-tools-chevron w-5 h-5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="learning-tools-content">
                    <div class="learning-tools-content-inner space-y-3 px-1 pb-3 pt-1">
                        <div class="bg-gray-800/95 rounded-2xl border border-gray-600/80 p-2.5 shadow-lg flex items-center gap-2 overflow-x-auto">
                            <!-- Level Filter -->
                            <select v-model="taskManager.filterLevel.value" class="h-10 px-3 bg-gray-900 rounded-xl border border-gray-600 text-xs text-gray-200 font-semibold focus:outline-none focus:border-indigo-400 shrink-0">
                                <option value="">Tất cả Trình độ</option>
                                <option value="B1">B1 - Intermediate</option>
                                <option value="B2">B2 - Upper Intermediate</option>
                                <option value="C1">C1 - Advanced</option>
                                <option value="IELTS">IELTS Writing</option>
                            </select>

                            <!-- Search -->
                            <div class="relative flex-1 min-w-[200px]">
                                <input v-model="taskManager.searchQuery.value" placeholder="Tìm kiếm đề bài viết, từ khóa..." class="h-10 w-full pl-8 pr-7 bg-gray-900 rounded-xl border border-gray-600 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                                <button v-if="taskManager.searchQuery.value" @click="taskManager.searchQuery.value = ''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                            </div>

                            <!-- Count badge -->
                            <span class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-900 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 shrink-0">
                                {{ taskManager.filteredItems.value.length }} đề bài
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
                <span>Đang tải danh sách đề luyện viết...</span>
            </div>

            <!-- Centered Studio Card -->
            <div v-else-if="activeWriting" class="studio-card space-y-4 sm:space-y-5">
                <!-- Header -->
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(activeWriting.level)]">
                            <i class="fa-solid fa-pen-nib text-[10px] mr-1"></i>
                            <span>{{ activeWriting.level }}</span>
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-mono font-semibold uppercase"> Writing Studio </span>
                        <button @click="taskManager.drawerOpen.value = true" class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700/60 transition flex items-center gap-1.5 shadow-sm" title="Bấm để mở danh sách chọn đề viết">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
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
                    {{ activeWriting.title }}
                </h1>

                <!-- Prompt Details -->
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-5 sm:p-6 space-y-2.5 shadow-sm">
                    <h3 class="text-xs sm:text-sm font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-file-lines text-xs"></i>
                        <span>Yêu Cầu Đề Bài</span>
                    </h3>
                    <p class="whitespace-pre-wrap text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed pl-6 font-normal">{{ activeWriting.prompt }}</p>
                    <p v-if="activeWriting.content?.instructions" class="tip-box mt-3 ml-6 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-info text-indigo-600"></i>
                        <span>{{ activeWriting.content.instructions }}</span>
                    </p>
                </div>

                <!-- Target Vocabulary -->
                <div v-if="activeWriting.content?.key_vocabulary?.length" class="space-y-2">
                    <h3 class="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                        <i class="fa-solid fa-key text-xs"></i>
                        <span>Target Vocabulary</span>
                    </h3>
                    <div class="flex flex-wrap gap-2 pl-6">
                        <span v-for="word in activeWriting.content.key_vocabulary" :key="word" class="badge text-xs sm:text-sm px-3 py-1">
                            {{ word }}
                        </span>
                    </div>
                </div>

                <!-- Editor -->
                <div class="space-y-2">
                    <div class="flex justify-between items-center text-xs sm:text-sm">
                        <b class="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                            <i class="fa-solid fa-pen-nib text-xs text-indigo-600"></i>
                            <span>Bài viết của bạn:</span>
                        </b>
                        <span class="font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-900 px-3 py-1 rounded-xl border border-indigo-200 dark:border-slate-800 font-bold">
                            {{ writingWordCount }} từ · {{ writingSubmission.length }} ký tự
                        </span>
                    </div>
                    <textarea v-model="writingSubmission" rows="10" class="input-control leading-relaxed text-sm sm:text-base" placeholder="Bắt đầu viết bài luận, đoạn văn hoặc email của bạn tại đây..."></textarea>
                </div>

                <!-- Action buttons -->
                <div class="flex flex-wrap gap-2.5">
                    <button class="primary-button px-6 py-2.5 flex items-center gap-2" :disabled="evaluator.isEvaluating.value" @click="evaluate">
                        <i class="fa-solid fa-robot"></i>
                        <span>{{ evaluator.isEvaluating.value ? "Đang chấm bài..." : "AI Chấm & Sửa Lỗi" }}</span>
                    </button>
                    <button v-if="writingModelAnswer" class="secondary-button flex items-center gap-1.5" @click="showWritingSample = !showWritingSample">
                        <i class="fa-solid fa-lightbulb text-amber-500"></i>
                        <span>{{ showWritingSample ? "Ẩn" : "Xem" }} Bài Mẫu</span>
                    </button>
                </div>

                <!-- Model Essay -->
                <div v-if="showWritingSample" class="rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 space-y-2.5 shadow-sm">
                    <h3 class="text-xs sm:text-sm font-bold uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-lightbulb text-xs text-amber-600"></i>
                        <span>Model Essay (Bài Viết Mẫu)</span>
                    </h3>
                    <p class="whitespace-pre-wrap text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed pl-6 font-normal">{{ writingModelAnswer }}</p>
                </div>

                <!-- Feedback card -->
                <FeedbackCard v-if="evaluator.feedback.value" :feedback="evaluator.feedback.value" title="Đánh Giá Kỹ Năng Viết" />

                <!-- Bottom Navigation Bar Component -->
                <ItemNavControls
                    :current-index="taskManager.currentIndex.value"
                    :total-items="taskManager.filteredItems.value.length"
                    label="Đề"
                    drawer-icon="fa-solid fa-pen-to-square"
                    @prev="taskManager.moveIndex(-1)"
                    @next="taskManager.moveIndex(1)"
                    @random="taskManager.randomItem"
                    @open-drawer="taskManager.drawerOpen.value = true"
                />
            </div>

            <div v-else class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-box-open text-gray-400"></i>
                <span>Chưa có đề luyện viết nào phù hợp với bộ lọc hiện tại.</span>
            </div>

            <!-- Polymorphic Item Drawer Modal -->
            <ItemDrawerModal
                :is-open="taskManager.drawerOpen.value"
                title="Danh Sách Đề Luyện Viết"
                icon="fa-solid fa-pen-to-square"
                :items="taskManager.filteredDrawerItems.value"
                :active-index="taskManager.currentIndex.value"
                :search-query="taskManager.drawerSearch.value"
                search-placeholder="Tìm đề viết trong danh sách..."
                badge-key="level"
                @close="taskManager.drawerOpen.value = false"
                @select="taskManager.selectDrawerItem"
                @update:search-query="taskManager.drawerSearch.value = $event"
            />

            <!-- AI Generator Modal -->
            <AIGeneratorModal :is-open="aiGeneratorOpen" type="writing" @close="aiGeneratorOpen = false" @generated="loadWriting" />
        </section>
    </LearningLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
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

const writingSubmission = ref("")
const showWritingSample = ref(false)
const aiGeneratorOpen = ref(false)

const clipboard = useClipboard()
const evaluator = useAIEvaluator("writing")

const taskManager = useTaskManager({
    fetchFn: (params) => getLearningItems({ category: "english", type: "writing", limit: 100, ...params }),
    onIndexChange: () => {
        writingSubmission.value = ""
        showWritingSample.value = false
        evaluator.resetEvaluation()
    },
})

const activeWriting = taskManager.activeItem

const writingWordCount = computed(() => {
    return writingSubmission.value.trim() ? writingSubmission.value.trim().split(/\s+/).length : 0
})

const writingModelAnswer = computed(() => {
    const item = activeWriting.value
    if (!item) return ""
    return item.sample_solution?.text || item.sample_solution?.answer || item.content?.sample_essay || item.content?.model_answer || ""
})

const loadWriting = () => taskManager.loadTasks()

const copyPromptText = () => {
    const p = activeWriting.value
    if (!p) return
    const text = `${p.title}\n\n${p.prompt}\n${p.content?.instructions || ""}`
    clipboard.copy(text)
}

const evaluate = async () => {
    try {
        await evaluator.evaluate(activeWriting.value?.id, writingSubmission.value)
    } catch (_) {}
}

onMounted(() => {
    loadWriting()
})
</script>
