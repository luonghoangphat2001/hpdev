<template>
    <LearningLayout :error="taskManager.error.value" @retry="loadSpeaking">
        <section class="space-y-4 max-w-4xl mx-auto">
            <!-- Top Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-300 hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ Luyện nói" title="Đóng/mở công cụ">
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
                                <option value="IELTS">IELTS Speaking</option>
                            </select>

                            <!-- Search -->
                            <div class="relative flex-1 min-w-[200px]">
                                <input v-model="taskManager.searchQuery.value" placeholder="Tìm kiếm topic nói, từ khóa..." class="h-10 w-full pl-8 pr-7 bg-gray-900 rounded-xl border border-gray-600 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                                <button v-if="taskManager.searchQuery.value" @click="taskManager.searchQuery.value = ''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                            </div>

                            <!-- Count badge -->
                            <span class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-900 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 shrink-0">
                                {{ taskManager.filteredItems.value.length }} topic nói
                            </span>

                            <!-- AI Generator -->
                            <button @click="aiGeneratorOpen = true" class="h-10 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
                                <span>AI Tạo Topic</span>
                            </button>
                        </div>
                    </div>
                </div>
            </details>

            <!-- Loading -->
            <div v-if="taskManager.loading.value" class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                <span>Đang tải danh sách chủ đề luyện nói...</span>
            </div>

            <!-- Centered Studio Card -->
            <div v-else-if="activeSpeaking" class="studio-card space-y-4 sm:space-y-5">
                <!-- Header -->
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(activeSpeaking.level)]">
                            <i class="fa-solid fa-microphone text-[10px] mr-1"></i>
                            <span>{{ activeSpeaking.level }}</span>
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-mono font-semibold uppercase"> Speaking Coach </span>
                        <button @click="taskManager.drawerOpen.value = true" class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700/60 transition flex items-center gap-1.5 shadow-sm" title="Bấm để mở danh sách chọn chủ đề">
                            <i class="fa-solid fa-comments text-xs"></i>
                            <span>Topic {{ taskManager.currentIndex.value + 1 }} / {{ taskManager.filteredItems.value.length }}</span>
                            <i class="fa-solid fa-caret-down text-[10px]"></i>
                        </button>
                    </div>

                    <div class="flex items-center gap-2">
                        <button @click="copyTopicText" class="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs transition flex items-center gap-1.5" title="Sao chép topic">
                            <i :class="clipboard.copied.value ? 'fa-solid fa-check text-emerald-600' : 'fa-solid fa-copy'"></i>
                            <span class="hidden sm:inline">{{ clipboard.copied.value ? "Đã chép" : "Sao chép" }}</span>
                        </button>
                    </div>
                </div>

                <!-- Title -->
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                    {{ activeSpeaking.title }}
                </h1>

                <!-- Topic Parts Breakdown -->
                <div class="space-y-3.5">
                    <!-- Part 1 -->
                    <div v-if="activeSpeaking.content?.part1_questions?.length" class="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-2.5 shadow-sm">
                        <h3 class="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                            <i class="fa-solid fa-comment-dots text-xs"></i>
                            <span>Part 1: Introduction & Warm-up</span>
                        </h3>
                        <ul class="list-disc list-inside text-sm sm:text-base space-y-2 pl-4 text-slate-800 dark:text-slate-100 font-normal leading-relaxed">
                            <li v-for="q in activeSpeaking.content.part1_questions" :key="q">{{ q }}</li>
                        </ul>
                    </div>

                    <!-- Part 2: Cue Card -->
                    <div v-if="activeSpeaking.content?.part2_cue_card" class="rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 space-y-3 shadow-sm">
                        <h3 class="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1.5">
                            <i class="fa-solid fa-layer-group text-xs"></i>
                            <span>Part 2: Candidate Cue Card (2 Minutes Speech)</span>
                        </h3>
                        <b class="text-base sm:text-lg text-slate-950 dark:text-white block pl-4 font-bold">{{ activeSpeaking.content.part2_cue_card.topic }}</b>
                        <ul class="list-disc list-inside text-sm sm:text-base space-y-1.5 pl-4 text-slate-800 dark:text-slate-100 font-normal leading-relaxed">
                            <li v-for="q in activeSpeaking.content.part2_cue_card.bullet_points" :key="q">{{ q }}</li>
                        </ul>
                    </div>

                    <!-- Part 3: Discussion -->
                    <div v-if="activeSpeaking.content?.part3_questions?.length" class="rounded-2xl border border-sky-200/90 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/30 p-5 space-y-2.5 shadow-sm">
                        <h3 class="text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-300 uppercase flex items-center gap-1.5">
                            <i class="fa-solid fa-lightbulb text-xs"></i>
                            <span>Part 3: In-depth Discussion</span>
                        </h3>
                        <ul class="list-disc list-inside text-sm sm:text-base space-y-2 pl-4 text-slate-800 dark:text-slate-100 font-normal leading-relaxed">
                            <li v-for="q in activeSpeaking.content.part3_questions" :key="q">{{ q }}</li>
                        </ul>
                    </div>

                    <!-- Fallback prompt -->
                    <div v-if="!hasSpeakingParts" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-5 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-normal">
                        {{ activeSpeaking.prompt }}
                    </div>
                </div>

                <!-- Target Expressions -->
                <div v-if="activeSpeaking.content?.target_expressions?.length" class="space-y-2">
                    <h3 class="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                        <i class="fa-solid fa-bullseye text-xs"></i>
                        <span>Target Expressions & Collocations</span>
                    </h3>
                    <div class="flex flex-wrap gap-2 pl-4">
                        <span v-for="phrase in activeSpeaking.content.target_expressions" :key="phrase" class="badge text-xs sm:text-sm px-3 py-1">
                            {{ phrase }}
                        </span>
                    </div>
                </div>

                <!-- Speech Recording Input -->
                <div class="space-y-2">
                    <label class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <i class="fa-solid fa-microphone text-xs text-indigo-600"></i>
                        <span>Bản ghi âm / Lời nói của bạn:</span>
                    </label>
                    <textarea v-model="speakingSubmission" rows="6" class="input-control text-sm sm:text-base leading-relaxed" placeholder="Bấm nút 'Bật Micro Nói' để nói trực tiếp, hoặc nhập câu trả lời của bạn..."></textarea>
                    <p v-if="speechError" class="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-semibold">{{ speechError }}</p>
                </div>

                <!-- Action Controls -->
                <div class="flex flex-wrap gap-2.5">
                    <button @click="toggleSpeech" :class="['px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-md', isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700']">
                        <i :class="isRecording ? 'fa-solid fa-stop' : 'fa-solid fa-microphone'"></i>
                        <span>{{ isRecording ? "Dừng ghi âm" : "Bật Micro Nói (STT)" }}</span>
                    </button>
                    <button class="primary-button px-6 py-2.5 flex items-center gap-2" :disabled="evaluator.isEvaluating.value" @click="evaluate">
                        <i class="fa-solid fa-robot"></i>
                        <span>{{ evaluator.isEvaluating.value ? "Đang đánh giá..." : "AI Coach Chấm Điểm" }}</span>
                    </button>
                    <button v-if="sampleSpeakingAnswers.length" class="secondary-button flex items-center gap-1.5" @click="showSampleAnswers = !showSampleAnswers">
                        <i class="fa-solid fa-lightbulb text-amber-500"></i>
                        <span>{{ showSampleAnswers ? "Ẩn" : "Xem" }} Câu Trả Lời Mẫu</span>
                    </button>
                </div>

                <!-- Sample Transcripts -->
                <div v-if="showSampleAnswers && sampleSpeakingAnswers.length" class="rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 space-y-3 shadow-sm">
                    <h3 class="text-xs sm:text-sm font-bold uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-lightbulb text-xs text-amber-600"></i>
                        <span>Sample High-Band Transcripts</span>
                    </h3>
                    <div class="space-y-2.5 pl-4">
                        <div v-for="(sample, index) in sampleSpeakingAnswers" :key="index" class="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200 dark:border-amber-800 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
                            <b class="text-slate-950 dark:text-white block mb-1">Mẫu {{ index + 1 }}:</b>
                            {{ sample }}
                        </div>
                    </div>
                </div>

                <!-- Feedback card -->
                <FeedbackCard v-if="evaluator.feedback.value" :feedback="evaluator.feedback.value" title="Đánh Giá Kỹ Năng Nói (Speaking Coach)" />

                <!-- Bottom Navigation Bar Component -->
                <ItemNavControls
                    :current-index="taskManager.currentIndex.value"
                    :total-items="taskManager.filteredItems.value.length"
                    label="Topic"
                    drawer-icon="fa-solid fa-comments"
                    @prev="taskManager.moveIndex(-1)"
                    @next="taskManager.moveIndex(1)"
                    @random="taskManager.randomItem"
                    @open-drawer="taskManager.drawerOpen.value = true"
                />
            </div>

            <div v-else class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-box-open text-gray-400"></i>
                <span>Chưa có chủ đề luyện nói nào phù hợp với bộ lọc hiện tại.</span>
            </div>

            <!-- Polymorphic Item Drawer Modal -->
            <ItemDrawerModal
                :is-open="taskManager.drawerOpen.value"
                title="Danh Sách Chủ Đề Luyện Nói"
                icon="fa-solid fa-comments"
                :items="taskManager.filteredDrawerItems.value"
                :active-index="taskManager.currentIndex.value"
                :search-query="taskManager.drawerSearch.value"
                search-placeholder="Tìm topic nói trong danh sách..."
                badge-key="level"
                @close="taskManager.drawerOpen.value = false"
                @select="taskManager.selectDrawerItem"
                @update:search-query="taskManager.drawerSearch.value = $event"
            />

            <!-- AI Generator Modal -->
            <AIGeneratorModal :is-open="aiGeneratorOpen" type="speaking" @close="aiGeneratorOpen = false" @generated="loadSpeaking" />
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
import { useSpeechCoach } from "@/composables/useSpeechCoach"

const speakingSubmission = ref("")
const showSampleAnswers = ref(false)
const aiGeneratorOpen = ref(false)

const clipboard = useClipboard()
const evaluator = useAIEvaluator("speaking")

const { isRecording, speechError, toggleSpeech } = useSpeechCoach((text) => {
    speakingSubmission.value = speakingSubmission.value ? `${speakingSubmission.value} ${text}` : text
})

const taskManager = useTaskManager({
    fetchFn: (params) => getLearningItems({ category: "english", type: "speaking", limit: 100, ...params }),
    onIndexChange: () => {
        speakingSubmission.value = ""
        showSampleAnswers.value = false
        evaluator.resetEvaluation()
    },
})

const activeSpeaking = taskManager.activeItem

const hasSpeakingParts = computed(() => {
    const c = activeSpeaking.value?.content
    return !!(c?.part1_questions?.length || c?.part2_cue_card || c?.part3_questions?.length)
})

const sampleSpeakingAnswers = computed(() => {
    const item = activeSpeaking.value
    if (!item) return []
    const raw = item.sample_solution?.sample_answers || item.content?.sample_answers || item.sample_solution?.answers
    if (Array.isArray(raw)) return raw
    if (typeof raw === "string") return [raw]
    return []
})

const loadSpeaking = () => taskManager.loadTasks()

const copyTopicText = () => {
    const p = activeSpeaking.value
    if (!p) return
    const text = `${p.title}\n\n${p.prompt}`
    clipboard.copy(text)
}

const evaluate = async () => {
    try {
        await evaluator.evaluate(activeSpeaking.value?.id, speakingSubmission.value)
    } catch (_) {}
}

onMounted(() => {
    loadSpeaking()
})
</script>
