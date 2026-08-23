<template>
    <LearningLayout :error="error" @retry="loadTech">
        <section class="space-y-4">
            <!-- Collapsible Top Filter Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-300 hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ học Tech" title="Đóng/mở công cụ">
                    <svg class="learning-tools-chevron w-5 h-5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="learning-tools-content">
                    <div class="learning-tools-content-inner space-y-3 px-1 pb-3 pt-1">
                        <div class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 p-2.5 shadow-sm dark:shadow-md flex items-center gap-2 overflow-x-auto">
                            <!-- Search -->
                            <div class="relative flex-1 min-w-[200px]">
                                <input v-model="learningStore.searchQuery" @input="debouncedTechLoad" placeholder="Tìm câu hỏi, code, từ khóa..." class="h-10 w-full pl-8 pr-7 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                                <button v-if="learningStore.searchQuery" @click="clearTechSearch" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                            </div>

                            <!-- Level Filter -->
                            <select v-model="learningStore.filterLevel" @change="learningStore.loadQuestions" class="h-10 px-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 font-semibold shrink-0">
                                <option value="">Tất cả Level</option>
                                <option value="beginner">Beginner / Fresher</option>
                                <option value="junior">Junior</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced / Senior</option>
                            </select>

                            <!-- Question List Button -->
                            <button @click="questionDrawerOpen = true" class="h-10 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shadow-sm shrink-0" title="Xem danh sách tất cả câu hỏi">
                                <i class="fa-solid fa-list-check text-xs"></i>
                                <span>Danh sách câu ({{ learningStore.techQuestions.length }})</span>
                            </button>

                            <!-- Bookmark Filter -->
                            <button @click="toggleTechBookmark" class="h-10 px-3 rounded-xl border text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0" :class="learningStore.filterBookmark ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300' : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'">
                                <i class="fa-solid fa-bookmark text-xs"></i>
                                <span>Yêu thích</span>
                            </button>

                            <!-- Mode Switcher -->
                            <div class="h-10 flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-300 dark:border-gray-700 shrink-0">
                                <button v-for="mode in techModes" :key="mode.key" @click="techMode = mode.key" class="h-8 px-3 rounded-lg text-xs font-semibold transition" :class="techMode === mode.key ? 'bg-indigo-600 text-white font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'">
                                    {{ mode.label }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>

            <!-- Loading State -->
            <div v-if="learningStore.loading" class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                <span>Đang tải ngân hàng câu hỏi...</span>
            </div>

            <!-- Flashcard Mode -->
            <div v-else-if="techMode === 'flashcard'" class="max-w-2xl mx-auto space-y-4">
                <Flashcard3D v-if="activeTechQuestion" :question="normalizedTechQuestion" :index="learningStore.flashcardIndex" @bookmark="learningStore.toggleBookmark" />
                <div class="flex justify-center items-center gap-4 bg-gray-800/80 p-3 rounded-2xl border border-gray-700/80 shadow-lg">
                    <button class="nav-button px-4 py-2 flex items-center gap-1.5" :disabled="learningStore.flashcardIndex <= 0" @click="moveTech(-1)">
                        <i class="fa-solid fa-arrow-left text-xs"></i>
                        <span>Trước</span>
                    </button>
                    <button @click="questionDrawerOpen = true" class="text-xs font-mono font-bold text-indigo-300 bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition" title="Bấm để chọn câu hỏi">
                        {{ learningStore.flashcardIndex + 1 }} / {{ learningStore.techQuestions.length }}
                        <i class="fa-solid fa-caret-down text-[10px] ml-1"></i>
                    </button>
                    <button class="nav-button px-4 py-2 flex items-center gap-1.5" :disabled="learningStore.flashcardIndex >= learningStore.techQuestions.length - 1" @click="moveTech(1)">
                        <span>Sau</span>
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                </div>
            </div>

            <!-- Exam Mode -->
            <div v-else-if="techMode === 'exam'" class="studio-card text-center space-y-4">
                <i class="fa-solid fa-pen-to-square text-4xl text-indigo-600"></i>
                <h2 class="font-bold text-slate-900 dark:text-white text-lg">Thi thử Tech từ dữ liệu đã học</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Tạo đề thích ứng 20 câu từ ngân hàng {{ learningStore.activeTechSlug }}.</p>
                <button class="primary-button" @click="startTechExam">Bắt đầu đề 20 câu</button>
                <div v-if="techExam.length" class="text-left space-y-3 mt-5">
                    <div v-for="(q, index) in techExam" :key="q.id" class="p-4 rounded-xl bg-gray-900 border border-gray-700 space-y-2">
                        <p class="text-xs font-bold text-white leading-relaxed">Câu {{ index + 1 }}. {{ q.question || q.title }}</p>
                        <div class="grid sm:grid-cols-2 gap-2 mt-3">
                            <button v-for="option in q.options" :key="option.id || option" class="answer-button">
                                {{ option.text || option }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Centered Question Studio Mode -->
            <div v-else class="tech-study-layout space-y-4">
                <div v-if="activeTechQuestion" class="studio-card space-y-4 sm:space-y-5">
                    <!-- Question Header -->
                    <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(activeTechQuestion.level)]">
                                {{ activeTechQuestion.level || "junior" }}
                            </span>
                            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {{ activeTechQuestion.learning_name || learningStore.activeTechSlug }}
                            </span>
                            <button @click="questionDrawerOpen = true" class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700/60 transition flex items-center gap-1.5 shadow-sm" title="Bấm để mở danh sách chọn câu hỏi">
                                <i class="fa-solid fa-list-check text-[11px]"></i>
                                <span>Câu {{ techIndex + 1 }} / {{ learningStore.techQuestions.length }}</span>
                                <i class="fa-solid fa-caret-down text-[10px]"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="copyQuestionText" class="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs transition flex items-center gap-1.5" title="Sao chép câu hỏi">
                                <i :class="clipboard.copied.value ? 'fa-solid fa-check text-emerald-600' : 'fa-solid fa-copy'"></i>
                                <span class="hidden sm:inline">{{ clipboard.copied.value ? "Đã chép" : "Sao chép" }}</span>
                            </button>
                            <button @click="learningStore.toggleBookmark(activeTechQuestion)" class="text-lg transition" :class="activeTechQuestion.is_bookmarked ? 'text-amber-500' : 'text-gray-400'" title="Đánh dấu yêu thích">
                                <i :class="activeTechQuestion.is_bookmarked ? 'fa-solid fa-star text-amber-500' : 'fa-regular fa-star text-gray-400'"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Question Title -->
                    <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">{{ activeTechQuestion.title }}</h2>

                    <!-- Prompt / Scenario -->
                    <div v-if="activeTechQuestion.prompt" class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                        <div class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-question text-xs"></i>
                            <span>Đề bài / Tình huống</span>
                        </div>
                        <p class="font-normal">{{ activeTechQuestion.prompt }}</p>
                    </div>

                    <!-- Quick Answer Section -->
                    <div v-if="techContent.quick_answer" class="rounded-2xl border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 space-y-2 shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                            <i class="fa-solid fa-bolt text-xs text-emerald-600 dark:text-emerald-400"></i>
                            <span>Trả lời nhanh</span>
                        </h3>
                        <p class="text-sm sm:text-base text-slate-950 dark:text-white leading-relaxed font-bold pl-5">{{ techContent.quick_answer }}</p>
                    </div>

                    <!-- Detailed Explanation Section -->
                    <div v-if="techContent.detailed_answer || techSample.detailed_answer" class="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 sm:p-5 space-y-2 shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-book-open-reader text-xs text-indigo-600 dark:text-indigo-400"></i>
                            <span>Giải thích chi tiết</span>
                        </h3>
                        <div class="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-5 font-normal">{{ techContent.detailed_answer || techSample.detailed_answer }}</div>
                    </div>

                    <!-- Code Snippet IDE Box -->
                    <CodeSnippetBox v-if="techContent.code || techContent.code_snippet" :code="techContent.code || techContent.code_snippet" :title="`${String(learningStore.activeTechSlug || 'Code').toUpperCase()} Example`" />

                    <!-- Interview Tips Section -->
                    <div v-if="techContent.interview_tips" class="rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm text-amber-950 dark:text-amber-100 leading-relaxed shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                            <i class="fa-solid fa-bullseye text-xs text-amber-600 dark:text-amber-400"></i>
                            <span>Mẹo phỏng vấn</span>
                        </h3>
                        <div class="pl-5 font-medium leading-relaxed">{{ techContent.interview_tips }}</div>
                    </div>

                    <!-- Practical Tips Section -->
                    <div v-if="techContent.practical_tips" class="rounded-2xl border border-sky-200/90 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/30 p-4 text-sm text-sky-950 dark:text-sky-100 leading-relaxed shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-400 flex items-center gap-1.5 mb-1.5">
                            <i class="fa-solid fa-lightbulb text-xs text-sky-600 dark:text-sky-400"></i>
                            <span>Ứng dụng thực tế</span>
                        </h3>
                        <div class="pl-5 font-medium leading-relaxed">{{ techContent.practical_tips }}</div>
                    </div>

                    <!-- Bottom Navigation Controls Component -->
                    <ItemNavControls
                        :current-index="techIndex"
                        :total-items="learningStore.techQuestions.length"
                        label="Câu"
                        drawer-icon="fa-solid fa-list-check"
                        @prev="moveTech(-1)"
                        @next="moveTech(1)"
                        @random="randomTechQuestion"
                        @open-drawer="questionDrawerOpen = true"
                    />
                </div>
                <div v-else class="loading-card flex items-center justify-center gap-2">
                    <i class="fa-solid fa-box-open text-gray-400"></i>
                    <span>Chưa có câu hỏi phù hợp với bộ lọc hiện tại.</span>
                </div>
            </div>

            <!-- Polymorphic Item Drawer Modal -->
            <ItemDrawerModal
                :is-open="questionDrawerOpen"
                :title="`Ngân Hàng Câu Hỏi ${String(learningStore.activeTechSlug || 'Tech').toUpperCase()}`"
                icon="fa-solid fa-list-check"
                :items="filteredDrawerQuestions"
                :active-index="techIndex"
                :search-query="drawerSearch"
                search-placeholder="Lọc câu hỏi trong danh sách..."
                badge-key="level"
                @close="questionDrawerOpen = false"
                @select="selectDrawerQuestion"
                @update:search-query="drawerSearch = $event"
            />
        </section>
    </LearningLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useLearningStore } from "@/stores/learning"
import LearningLayout from "@/layouts/LearningLayout.vue"
import Flashcard3D from "@/components/learning/Flashcard3D.vue"
import CodeSnippetBox from "@/components/learning/CodeSnippetBox.vue"
import ItemDrawerModal from "@/components/learning/ItemDrawerModal.vue"
import ItemNavControls from "@/components/learning/ItemNavControls.vue"
import { buildPracticeExam } from "@/api/learning"
import { parseJsonObject, getLevelBadgeClass } from "@/composables/useLearningHelper"
import { useClipboard } from "@/composables/useClipboard"

const route = useRoute()
const learningStore = useLearningStore()
const clipboard = useClipboard()
const error = ref("")

const techModes = [
    { key: "split", label: "Học theo câu" },
    { key: "flashcard", label: "Flashcard" },
    { key: "exam", label: "Thi thử" },
]
const techMode = ref("split")
const techExam = ref([])
const questionDrawerOpen = ref(false)
const drawerSearch = ref("")

const activeTechQuestion = computed(() => learningStore.activeQuestion)
const techIndex = computed(() => learningStore.techQuestions.findIndex((q) => q.id === activeTechQuestion.value?.id))
const techContent = computed(() => parseJsonObject(activeTechQuestion.value?.content))
const techSample = computed(() => parseJsonObject(activeTechQuestion.value?.sample_solution))
const normalizedTechQuestion = computed(() => ({
    ...activeTechQuestion.value,
    answer: techContent.value.quick_answer || techContent.value.detailed_answer || techSample.value.detailed_answer,
}))

const filteredDrawerQuestions = computed(() => {
    if (!drawerSearch.value.trim()) return learningStore.techQuestions
    const q = drawerSearch.value.trim().toLowerCase()
    return learningStore.techQuestions.filter(
        (item) =>
            String(item.title || "")
                .toLowerCase()
                .includes(q) ||
            String(item.prompt || "")
                .toLowerCase()
                .includes(q),
    )
})

const selectDrawerQuestion = (question) => {
    const idx = learningStore.techQuestions.findIndex((q) => q.id === question.id)
    if (idx !== -1) {
        learningStore.flashcardIndex = idx
        learningStore.selectQuestion(question)
    }
    questionDrawerOpen.value = false
}

const copyQuestionText = () => {
    const q = activeTechQuestion.value
    if (!q) return
    const text = `${q.title}${q.prompt ? `\n\n${q.prompt}` : ""}`
    clipboard.copy(text)
}

let techTimer = null
const debouncedTechLoad = () => {
    clearTimeout(techTimer)
    techTimer = setTimeout(() => learningStore.loadQuestions(), 250)
}

const clearTechSearch = () => {
    learningStore.searchQuery = ""
    learningStore.loadQuestions()
}

const toggleTechBookmark = () => {
    learningStore.filterBookmark = !learningStore.filterBookmark
    learningStore.loadQuestions()
}

const moveTech = (offset) => {
    const index = Math.max(0, Math.min(learningStore.techQuestions.length - 1, techIndex.value + offset))
    learningStore.flashcardIndex = index
    learningStore.selectQuestion(learningStore.techQuestions[index])
}

const randomTechQuestion = () => {
    if (learningStore.techQuestions.length <= 1) return
    let nextIdx
    do {
        nextIdx = Math.floor(Math.random() * learningStore.techQuestions.length)
    } while (nextIdx === techIndex.value)
    learningStore.flashcardIndex = nextIdx
    learningStore.selectQuestion(learningStore.techQuestions[nextIdx])
}

const loadTech = async () => {
    error.value = ""
    try {
        await learningStore.loadTechStacks()
        const requestedStack = String(route.params.stack || "")
        if (requestedStack && learningStore.techStacks.some((stack) => stack.slug === requestedStack)) {
            learningStore.activeTechSlug = requestedStack
        }
        await learningStore.loadQuestions()
    } catch (err) {
        error.value = err?.message || "Không thể tải ngân hàng câu hỏi Tech."
    }
}

const startTechExam = async () => {
    try {
        const res = await buildPracticeExam({ category: "tech", learnings: learningStore.activeTechSlug, count: 20 })
        techExam.value = res.questions || []
    } catch (err) {
        error.value = err?.message || "Không thể tạo đề thi Tech."
    }
}

const handleKeydown = (event) => {
    if (questionDrawerOpen.value) {
        if (event.key === "Escape") {
            questionDrawerOpen.value = false
        }
        return
    }

    const target = event.target
    const tagName = target?.tagName?.toLowerCase()
    if (target?.isContentEditable || ["input", "textarea", "select"].includes(tagName)) return

    if (event.key === "ArrowLeft") {
        event.preventDefault()
        moveTech(-1)
    } else if (event.key === "ArrowRight") {
        event.preventDefault()
        moveTech(1)
    } else if (event.key === "b" || event.key === "B") {
        event.preventDefault()
        if (activeTechQuestion.value) {
            learningStore.toggleBookmark(activeTechQuestion.value)
        }
    }
}

watch(
    () => route.params.stack,
    (slug) => {
        if (slug && slug !== learningStore.activeTechSlug) {
            learningStore.setTechSlug(String(slug))
        }
    },
)

onMounted(() => {
    loadTech()
    document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
    clearTimeout(techTimer)
    document.removeEventListener("keydown", handleKeydown)
})
</script>
