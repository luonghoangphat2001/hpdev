<template>
    <div class="max-w-2xl mx-auto p-4">
        <!-- Quiz Header with Timer & Streak -->
        <div class="flex items-center justify-between bg-gray-800/90 border border-gray-700/80 rounded-2xl p-4 mb-4">
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-fire text-amber-500 text-2xl"></i>
                <div>
                    <span class="text-xs text-gray-400 uppercase font-semibold">Chuỗi đúng</span>
                    <p class="text-lg font-bold text-amber-400">{{ streak }} câu</p>
                </div>
            </div>
            <div class="text-center">
                <span class="text-xs text-gray-400 uppercase font-semibold">Điểm</span>
                <p class="text-lg font-bold text-indigo-400">{{ score }}</p>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 transition" :class="timeLeft <= 5 ? 'border-rose-500 text-rose-400 bg-rose-500/10 animate-pulse' : 'border-indigo-500 text-indigo-400 bg-indigo-500/10'">
                    {{ timeLeft }}
                </div>
            </div>
        </div>

        <!-- Question Card -->
        <div v-if="currentQuestion" class="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl mb-4">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span class="font-mono">Câu {{ currentIndex + 1 }} / {{ totalQuestions }}</span>
                <span class="px-2 py-0.5 rounded bg-gray-700 font-semibold">{{ currentQuestion.level || "General" }}</span>
            </div>
            <h3 class="text-base md:text-lg font-bold text-white leading-relaxed mb-6">
                {{ currentQuestion.question || currentQuestion.title }}
            </h3>

            <!-- Options -->
            <div class="space-y-3">
                <button v-for="(opt, idx) in options" :key="idx" @click="selectOption(opt, idx)" :disabled="answered" :class="['w-full text-left p-4 rounded-2xl border text-sm font-medium transition flex items-center justify-between', getOptionClass(opt, idx)]">
                    <span>{{ opt }}</span>
                    <i v-if="answered && isCorrectOption(opt)" class="fa-solid fa-check text-emerald-400 font-bold"></i>
                    <i v-else-if="answered && isWrongSelected(idx)" class="fa-solid fa-xmark text-rose-400 font-bold"></i>
                </button>
            </div>
        </div>

        <!-- Quiz Completed State -->
        <div v-else class="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-8 text-center shadow-xl">
            <i class="fa-solid fa-trophy text-5xl text-amber-400 block mb-3"></i>
            <h3 class="text-xl font-bold text-white mb-2">Hoàn thành bài Quiz!</h3>
            <p class="text-sm text-gray-300 mb-6">
                Bạn đã đạt được <strong class="text-indigo-400 font-bold">{{ score }}</strong> điểm với chuỗi tối đa <strong class="text-amber-400">{{ maxStreak }}</strong> câu!
            </p>
            <button @click="$emit('restart')" class="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/30">Làm lại bài mới</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue"

const props = defineProps({
    questions: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(["restart", "finished"])

const currentIndex = ref(0)
const score = ref(0)
const streak = ref(0)
const maxStreak = ref(0)
const timeLeft = ref(15)
const answered = ref(false)
const selectedIndex = ref(-1)
let timer = null

const currentQuestion = computed(() => props.questions[currentIndex.value] || null)
const totalQuestions = computed(() => props.questions.length)

const options = computed(() => {
    if (!currentQuestion.value) return []
    if (Array.isArray(currentQuestion.value.options)) return currentQuestion.value.options
    if (currentQuestion.value.options_json) {
        try {
            return JSON.parse(currentQuestion.value.options_json)
        } catch (_) {}
    }
    return [currentQuestion.value.answer || "Đáp án chính xác", "Lựa chọn A thay thế", "Lựa chọn B thay thế", "Lựa chọn C thay thế"]
})

const isCorrectOption = (opt) => {
    const correct = currentQuestion.value?.correct_answer || currentQuestion.value?.answer || ""
    return opt.trim() === correct.trim()
}

const isWrongSelected = (idx) => {
    return selectedIndex.value === idx && !isCorrectOption(options.value[idx])
}

const getOptionClass = (opt, idx) => {
    if (!answered.value) {
        return "bg-gray-700/60 border-gray-600/80 hover:bg-gray-700 hover:border-indigo-500 text-gray-200"
    }
    if (isCorrectOption(opt)) {
        return "bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30"
    }
    if (selectedIndex.value === idx) {
        return "bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30"
    }
    return "bg-gray-800/40 border-gray-700/40 text-gray-500 opacity-60"
}

const startTimer = () => {
    clearInterval(timer)
    timeLeft.value = 15
    timer = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--
        } else {
            clearInterval(timer)
            handleTimeout()
        }
    }, 1000)
}

const selectOption = (opt, idx) => {
    if (answered.value) return
    clearInterval(timer)
    answered.value = true
    selectedIndex.value = idx

    const correct = isCorrectOption(opt)
    if (correct) {
        score.value += 10 + streak.value * 2
        streak.value++
        if (streak.value > maxStreak.value) maxStreak.value = streak.value
    } else {
        streak.value = 0
    }

    setTimeout(nextQuestion, 1500)
}

const handleTimeout = () => {
    answered.value = true
    selectedIndex.value = -1
    streak.value = 0
    setTimeout(nextQuestion, 1500)
}

const nextQuestion = () => {
    answered.value = false
    selectedIndex.value = -1
    if (currentIndex.value < totalQuestions.value - 1) {
        currentIndex.value++
        startTimer()
    } else {
        currentIndex.value = totalQuestions.value
        emit("finished", { score: score.value, maxStreak: maxStreak.value })
    }
}

watch(
    () => props.questions,
    () => {
        currentIndex.value = 0
        score.value = 0
        streak.value = 0
        if (props.questions.length > 0) startTimer()
    },
)

onMounted(() => {
    if (props.questions.length > 0) startTimer()
})

onUnmounted(() => {
    clearInterval(timer)
})
</script>
