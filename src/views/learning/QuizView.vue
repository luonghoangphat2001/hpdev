<template>
    <LearningLayout :error="error" @retry="startQuiz">
        <section class="max-w-3xl w-full mx-auto min-h-[calc(100vh-7.5rem)] flex flex-col justify-center py-2 sm:py-4">
            <!-- Leaderboard View -->
            <div v-if="quizMode === 'leaderboard'" class="studio-card p-5 space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 class="font-bold text-gray-900 dark:text-white text-base">Bảng Xếp Hạng Luyện Tập</h2>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Thành tích học viên đạt kết quả cao.</p>
                    </div>
                    <button @click="loadLeaderboard" class="secondary-button text-xs font-semibold">Làm mới</button>
                </div>

                <div class="overflow-x-auto touch-scroll rounded-xl border border-gray-200 dark:border-gray-700">
                    <table class="w-full min-w-[500px] text-left text-xs text-gray-700 dark:text-gray-300">
                        <thead class="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 uppercase font-semibold text-[11px] border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th class="px-4 py-3">Hạng</th>
                                <th class="px-4 py-3">Học viên</th>
                                <th class="px-4 py-3 text-center">Số bài</th>
                                <th class="px-4 py-3 text-center">Điểm cao nhất</th>
                                <th class="px-4 py-3 text-right">Điểm TB</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 bg-white dark:bg-gray-800/40">
                            <tr v-for="(row, i) in leaderboard" :key="`${row.username}-${i}`" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                <td class="px-4 py-3 font-mono font-bold text-gray-500 dark:text-gray-400">#{{ i + 1 }}</td>
                                <td class="px-4 py-3 font-bold text-gray-900 dark:text-white">{{ row.username }}</td>
                                <td class="px-4 py-3 text-center font-mono text-gray-600 dark:text-gray-300">{{ row.total_quizzes }}</td>
                                <td class="px-4 py-3 text-center font-mono text-indigo-700 dark:text-indigo-300 font-bold">{{ row.best_score }}</td>
                                <td class="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">{{ row.avg_score }}</td>
                            </tr>
                            <tr v-if="!leaderboard.length">
                                <td colspan="5" class="px-4 py-8 text-center text-gray-400">Chưa có ai hoàn thành bài kiểm tra</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Quiz Finished / Game Over Screen -->
            <div v-else-if="quizFinished" class="studio-card text-center space-y-5 py-8 px-6">
                <div class="space-y-1">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Hoàn Thành Bài Luyện Tập</h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Kết quả làm bài của bạn:</p>
                </div>

                <!-- Stats Box -->
                <div class="grid grid-cols-3 gap-3 max-w-sm mx-auto p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div>
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-medium">Điểm số</span>
                        <b class="text-lg font-bold text-gray-900 dark:text-white font-mono">{{ quizScore }}/{{ quizQuestions.length }}</b>
                    </div>
                    <div class="border-x border-gray-200 dark:border-gray-700">
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-medium">Độ chính xác</span>
                        <b class="text-lg font-bold text-indigo-700 dark:text-indigo-300 font-mono">{{ Math.round((quizScore / (quizQuestions.length || 1)) * 100) }}%</b>
                    </div>
                    <div>
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-medium">Streak tốt nhất</span>
                        <b class="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">{{ maxStreak }}</b>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-center gap-3 pt-2">
                    <button @click="startQuiz" class="primary-button">Làm lại bài mới</button>
                    <button @click="resetQuizToLobby" class="secondary-button">Đổi chủ đề</button>
                </div>
            </div>

            <!-- Active Quiz Question HUD -->
            <div v-else-if="activeQuizQuestion" class="studio-card p-5 sm:p-6 space-y-5">
                <!-- Top HUD -->
                <div class="flex items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-gray-200 dark:border-gray-700"> Câu {{ quizIndex + 1 }} / {{ quizQuestions.length }} </span>
                        <span v-if="quizStreak >= 2" class="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-gray-900 text-amber-700 dark:text-amber-400 font-mono text-xs border border-amber-200 dark:border-gray-700"> Streak: {{ quizStreak }} </span>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="font-mono text-gray-600 dark:text-gray-300 text-xs">
                            Điểm: <b class="text-gray-900 dark:text-white">{{ quizScore }}</b>
                        </span>
                        <button @click="quizQuestions = []" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Dừng">Thoát</button>
                    </div>
                </div>

                <!-- Simple Progress Bar -->
                <div class="w-full bg-gray-200 dark:bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700/60">
                    <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" :style="{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }"></div>
                </div>

                <!-- Question Focus Box -->
                <div class="text-center space-y-2 py-4 px-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <span class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                        {{ quizMode === "spelling" ? "Điền từ tiếng Anh đúng nghĩa" : "Chọn nghĩa tiếng Việt" }}
                    </span>

                    <div class="flex items-center justify-center gap-3">
                        <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {{ quizMode === "spelling" ? activeQuizQuestion.correct_meaning : activeQuizQuestion.word }}
                        </h2>
                        <button v-if="quizMode !== 'spelling'" @click="speakWord(activeQuizQuestion.word)" class="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white transition text-base" title="Nghe phát âm">
                            <i class="fa-solid fa-volume-high"></i>
                        </button>
                    </div>

                    <div v-if="quizPronunciationText" class="text-sm font-semibold font-mono text-indigo-700 dark:text-indigo-300">
                        {{ quizPronunciationText }}
                    </div>

                    <p v-if="quizExampleText" class="text-sm sm:text-base text-slate-700 dark:text-slate-300 italic max-w-lg mx-auto pt-1 font-medium">"{{ quizExampleText }}"</p>
                </div>

                <!-- Spelling Input -->
                <div v-if="quizMode === 'spelling'" class="max-w-md mx-auto space-y-3">
                    <input ref="spellingInput" v-model="spellingAnswer" @keyup.enter="answerSpelling" :disabled="quizAnswered" class="input-control text-center font-bold text-lg sm:text-xl py-3.5" placeholder="Nhập từ tiếng Anh..." autofocus />
                    <button v-if="!quizAnswered" class="primary-button w-full font-bold text-base py-3" @click="answerSpelling">Kiểm tra đáp án</button>
                </div>

                <!-- Multiple Choice Options -->
                <div v-else class="grid sm:grid-cols-2 gap-3.5">
                    <button v-for="(option, optionIndex) in activeQuizQuestion.options" :key="option" @click="answerQuiz(option)" :disabled="quizAnswered" class="p-4 sm:p-5 rounded-2xl border text-left transition flex items-center justify-between gap-3 text-sm sm:text-base select-none shadow-sm" :class="quizOptionClass(option)">
                        <div class="flex items-center gap-3 min-w-0">
                            <span class="w-8 h-8 rounded-xl font-mono text-sm font-bold flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                {{ ["A", "B", "C", "D"][optionIndex] }}
                            </span>
                            <span class="font-semibold leading-relaxed truncate">
                                {{ cleanOptionText(option) }}
                            </span>
                        </div>
                        <kbd class="shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-xs font-mono text-slate-500 font-bold">
                            {{ optionIndex + 1 }}
                        </kbd>
                    </button>
                </div>

                <!-- Answer Feedback Box -->
                <div v-if="quizAnswered" class="p-4 rounded-2xl border space-y-2 text-sm" :class="lastQuizCorrect ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100' : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-950 dark:text-red-100'">
                    <div class="flex items-center justify-between gap-3">
                        <span class="font-bold text-sm sm:text-base">
                            {{ quizFeedbackText }}
                        </span>

                        <button class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition shrink-0 border border-slate-700 flex items-center gap-1.5" @click="nextQuiz">
                            <span>{{ quizAutoAdvancing && quizCountdown > 0 ? `Tiếp tục (${quizCountdown}s)` : "Câu tiếp" }}</span>
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </button>
                    </div>
                    <p v-if="activeQuizQuestion.note" class="text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                        <i class="fa-solid fa-lightbulb text-amber-500"></i>
                        <span>{{ activeQuizQuestion.note }}</span>
                    </p>
                </div>
            </div>

            <!-- Setup / Lobby Card -->
            <div v-else class="studio-card p-6 sm:p-7 space-y-6">
                <!-- Header -->
                <div>
                    <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                        {{ quizMode === "spelling" ? "Luyện Viết Từ Vựng (Spelling)" : "Luyện Trắc Nghiệm Phản Xạ" }}
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ quizMode === "spelling" ? "Nhập từ tiếng Anh theo gợi ý." : "Chọn đáp án chính xác trong 4 lựa chọn (phím 1 - 4)." }}
                    </p>
                </div>

                <!-- Topic Selector Cards Grid -->
                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-700 dark:text-gray-300 block"> Chọn chủ đề: </label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        <button type="button" @click="quizTopicNo = 0" class="p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 text-xs" :class="quizTopicNo === 0 ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-white font-semibold' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'">
                            <span class="text-[10px] text-gray-400">Tất cả</span>
                            <b class="truncate">Toàn bộ ngân hàng</b>
                        </button>
                        <button v-for="t in vocabTopics" :key="t.id" type="button" @click="quizTopicNo = Number(t.topic_no)" class="p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 text-xs" :class="quizTopicNo === Number(t.topic_no) ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-white font-semibold' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'">
                            <span class="text-[10px] text-gray-400">Topic {{ t.topic_no }}</span>
                            <b class="truncate">{{ t.name }}</b>
                        </button>
                    </div>
                </div>

                <!-- 2. Question Count Selector Buttons -->
                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-700 dark:text-gray-300 block"> Số câu hỏi: </label>
                    <div class="grid grid-cols-3 gap-2.5">
                        <button v-for="count in [5, 10, 20]" :key="count" type="button" @click="quizCount = count" class="p-2.5 rounded-xl border text-center transition font-semibold text-xs" :class="quizCount === count ? 'bg-indigo-600 border-indigo-500 text-white font-bold' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'">{{ count }} câu</button>
                    </div>
                </div>

                <!-- 3. Start Button -->
                <button @click="startQuiz" :disabled="quizLoading" class="primary-button w-full py-3 text-xs font-bold">
                    {{ quizLoading ? "Đang chuẩn bị đề..." : "Bắt đầu làm bài" }}
                </button>
            </div>
        </section>
    </LearningLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import LearningLayout from "@/layouts/LearningLayout.vue"
import { buildQuiz, getLearnings, getQuizLeaderboard, submitQuizResult } from "@/api/learning"

const route = useRoute()
const error = ref("")
const vocabTopics = ref([])

const quizMode = computed(() => {
    const mode = String(route.params.mode || "multiple_choice")
    return ["multiple_choice", "spelling", "leaderboard"].includes(mode) ? mode : "multiple_choice"
})

const quizTopicNo = ref(0)
const quizCount = ref(10)
const quizQuestions = ref([])
const quizIndex = ref(0)
const quizScore = ref(0)
const quizStreak = ref(0)
const maxStreak = ref(0)
const quizAnswered = ref(false)
const quizSelected = ref("")
const lastQuizCorrect = ref(false)
const spellingAnswer = ref("")
const quizFinished = ref(false)
const quizLoading = ref(false)
const leaderboard = ref([])
const quizAttempts = ref([])
const quizAutoAdvancing = ref(false)
const quizCountdown = ref(0)
let quizAutoAdvanceTimer = null
let quizCountdownTimer = null

const activeQuizQuestion = computed(() => quizQuestions.value[quizIndex.value])
const quizPronunciationText = computed(() => {
    const pronunciation = String(activeQuizQuestion.value?.pronunciation || "")
        .trim()
        .replace(/^\/+|\/+$/g, "")
    return pronunciation ? `/${pronunciation}/` : ""
})
const quizExampleText = computed(() => {
    const question = activeQuizQuestion.value
    return question?.example || question?.options_detail?.find((o) => o.example)?.example || ""
})
const quizCorrectText = computed(() => {
    const q = activeQuizQuestion.value
    if (!q) return ""
    return q.correct_meaning || q.options?.find((opt) => String(opt).startsWith(q.correct_option)) || ""
})
const quizFeedbackText = computed(() => {
    if (lastQuizCorrect.value) return "Chính xác! Làm tốt lắm 🎉"
    if (quizMode.value === "spelling") return `Chưa đúng. Đáp án: ${activeQuizQuestion.value?.word || ""}`
    return `Chưa chính xác. Đáp án: ${cleanOptionText(quizCorrectText.value)}`
})

const cleanOptionText = (option) => String(option || "").replace(/^[A-D]\.\s*/i, "")

const resetQuizAnswer = () => {
    quizAnswered.value = false
    quizSelected.value = ""
    lastQuizCorrect.value = false
    spellingAnswer.value = ""
    quizAutoAdvancing.value = false
    quizCountdown.value = 0
}

const clearQuizTimers = () => {
    if (quizAutoAdvanceTimer) {
        clearTimeout(quizAutoAdvanceTimer)
        quizAutoAdvanceTimer = null
    }
    if (quizCountdownTimer) {
        clearInterval(quizCountdownTimer)
        quizCountdownTimer = null
    }
    quizAutoAdvancing.value = false
    quizCountdown.value = 0
}

const scheduleQuizAdvance = (delayMs = 3000, startSeconds = 3) => {
    clearQuizTimers()
    quizAutoAdvancing.value = true
    quizCountdown.value = startSeconds
    quizCountdownTimer = setInterval(() => {
        if (quizCountdown.value > 1) {
            quizCountdown.value--
        } else {
            clearInterval(quizCountdownTimer)
            quizCountdownTimer = null
        }
    }, 1000)
    quizAutoAdvanceTimer = setTimeout(() => {
        nextQuiz()
    }, delayMs)
}

const startQuiz = async () => {
    quizLoading.value = true
    error.value = ""
    resetQuizAnswer()
    quizQuestions.value = []
    quizIndex.value = 0
    quizScore.value = 0
    quizStreak.value = 0
    maxStreak.value = 0
    quizFinished.value = false
    quizAttempts.value = []

    try {
        const res = await buildQuiz({
            mode: quizMode.value,
            count: Number(quizCount.value || 10),
            topic_no: quizTopicNo.value ? Number(quizTopicNo.value) : undefined,
        })
        quizQuestions.value = res.questions || []
    } catch (err) {
        error.value = err?.message || "Không thể tạo bài kiểm tra."
    } finally {
        quizLoading.value = false
    }
}

const resetQuizToLobby = () => {
    clearQuizTimers()
    quizQuestions.value = []
    quizFinished.value = false
    resetQuizAnswer()
}

const speakWord = (word) => {
    if (!word || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = "en-US"
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
}

const answerQuiz = (option) => {
    if (quizAnswered.value || !activeQuizQuestion.value) return
    quizSelected.value = option
    quizAnswered.value = true
    const isCorrect = String(option).startsWith(activeQuizQuestion.value.correct_option)
    recordQuizOutcome(isCorrect, option)
}

const answerSpelling = () => {
    if (quizAnswered.value || !activeQuizQuestion.value) return
    const input = String(spellingAnswer.value || "")
        .trim()
        .toLowerCase()
    const target = String(activeQuizQuestion.value.word || "")
        .trim()
        .toLowerCase()
    quizAnswered.value = true
    const isCorrect = Boolean(input && input === target)
    recordQuizOutcome(isCorrect, spellingAnswer.value)
}

const recordQuizOutcome = (isCorrect, selected) => {
    lastQuizCorrect.value = isCorrect
    if (isCorrect) {
        quizScore.value++
        quizStreak.value++
        if (quizStreak.value > maxStreak.value) maxStreak.value = quizStreak.value
    } else {
        quizStreak.value = 0
    }
    const q = activeQuizQuestion.value
    const isLastQuestion = quizIndex.value === quizQuestions.value.length - 1
    quizAttempts.value.push({
        item_id: q.id,
        is_correct: lastQuizCorrect.value,
        question: quizMode.value === "spelling" ? q.correct_meaning || q.word : q.word,
        selected_answer: selected,
        correct_answer: quizMode.value === "spelling" ? q.word : quizCorrectText.value,
    })
    if (quizMode.value === "multiple_choice" && lastQuizCorrect.value) {
        scheduleQuizAdvance(3000, 3)
    } else if (isLastQuestion) {
        scheduleQuizAdvance(quizMode.value === "spelling" ? 900 : 1100)
    }
}

const quizOptionClass = (option) => {
    if (!quizAnswered.value) {
        return "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
    }
    if (String(option).startsWith(activeQuizQuestion.value?.correct_option)) {
        return "border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold"
    }
    if (option === quizSelected.value) {
        return "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-300 font-bold"
    }
    return "opacity-40 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400"
}

const nextQuiz = async () => {
    clearQuizTimers()
    if (quizIndex.value < quizQuestions.value.length - 1) {
        quizIndex.value++
        resetQuizAnswer()
        return
    }
    quizFinished.value = true
    try {
        await submitQuizResult({
            score: quizScore.value,
            total: quizQuestions.value.length,
            details: { mode: quizMode.value, attempts: quizAttempts.value },
        })
    } catch (_) {}
}

const loadLeaderboard = async () => {
    try {
        const res = await getQuizLeaderboard(20)
        leaderboard.value = res.leaderboard || []
    } catch (err) {
        error.value = err?.message || "Không thể tải bảng xếp hạng."
    }
}

const handleRouteModeChange = async (mode) => {
    clearQuizTimers()
    if (mode === "leaderboard") {
        await loadLeaderboard()
    } else {
        quizQuestions.value = []
        quizFinished.value = false
    }
}

const loadQuizSetup = async () => {
    if (!vocabTopics.value.length) {
        const topics = await getLearnings("english", "vocabulary")
        vocabTopics.value = topics.learnings || []
    }
    await handleRouteModeChange(quizMode.value)
}

const handleKeydown = (event) => {
    const target = event.target
    const tagName = target?.tagName?.toLowerCase()
    if (target?.isContentEditable || ["input", "textarea", "select"].includes(tagName)) return

    if (quizMode.value !== "multiple_choice" || quizAnswered.value || !activeQuizQuestion.value) return
    const match = /^(?:Digit|Numpad)([1-4])$/.exec(event.code || "")
    const pressedNumber = match ? Number(match[1]) : Number(event.key)
    const option = activeQuizQuestion.value.options?.[pressedNumber - 1]
    if (!option) return
    event.preventDefault()
    answerQuiz(option)
}

watch(
    () => route.params.mode,
    (mode) => {
        handleRouteModeChange(mode)
    },
)

onMounted(() => {
    loadQuizSetup()
    document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
    clearQuizTimers()
    document.removeEventListener("keydown", handleKeydown)
})
</script>
