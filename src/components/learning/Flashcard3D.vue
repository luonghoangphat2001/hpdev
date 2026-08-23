<template>
    <div class="w-full max-w-2xl mx-auto perspective-1000 my-3">
        <div
            @click="flipped = !flipped"
            :class="[
                'relative w-full min-h-[380px] rounded-3xl p-5 sm:p-7 cursor-pointer transition-all duration-500 transform-style-3d shadow-md hover:shadow-xl border flex flex-col justify-between',
                flipped
                    ? 'rotate-y-180 bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-500/20'
                    : 'bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/80'
            ]"
        >
            <!-- ================= FRONT SIDE (Thử thách từ vựng / Câu hỏi) ================= -->
            <div v-if="!flipped" class="flex flex-col h-full justify-between space-y-6 backface-hidden">
                <!-- Top Toolbar -->
                <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                    <div class="flex items-center gap-2">
                        <span :class="['px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border', getLevelBadgeClass(question?.level)]">
                            {{ question?.level || "Vocabulary" }}
                        </span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">#{{ index + 1 }}</span>
                    </div>

                    <div class="flex items-center gap-1.5">
                        <button
                            v-if="wordTitle"
                            @click.stop="speak(wordTitle)"
                            class="w-9 h-9 rounded-xl text-base text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center shadow-xs border border-indigo-200 dark:border-indigo-800 shrink-0"
                            title="Phát âm tiếng Anh"
                        >
                            <i class="fa-solid fa-volume-high"></i>
                        </button>
                        <button
                            v-if="question?.is_bookmarked !== undefined"
                            @click.stop="$emit('bookmark', question)"
                            class="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 transition flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                            :class="question?.is_bookmarked ? '!text-amber-500' : ''"
                            title="Đánh dấu yêu thích"
                        >
                            <i :class="question?.is_bookmarked ? 'fa-solid fa-star text-amber-500' : 'fa-regular fa-star'"></i>
                        </button>
                    </div>
                </div>

                <!-- Central Vocabulary Front Core: ONLY English Word & IPA -->
                <div class="my-auto py-6 text-center space-y-4">
                    <div class="px-6 py-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/90 dark:border-indigo-400 shadow-sm ring-4 ring-indigo-500/10 w-full mx-auto">
                        <!-- English Word -->
                        <h2 class="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
                            {{ wordTitle }}
                        </h2>

                        <!-- IPA Pronunciation -->
                        <div v-if="ipa" class="mt-3">
                            <span class="text-sm sm:text-base font-semibold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/90 px-4 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60 inline-block">
                                /{{ ipa }}/
                            </span>
                        </div>
                    </div>

                    <!-- Tech question scenario if applicable -->
                    <div v-if="!ipa && !meaning && question?.prompt" class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {{ question.prompt }}
                    </div>
                </div>

                <!-- Bottom Flip Hint -->
                <div class="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                    <span class="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
                        <i class="fa-solid fa-lightbulb text-amber-500 shrink-0"></i>
                        <span>Bấm thẻ hoặc phím <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">Space</kbd> và <kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">←</kbd> <kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">→</kbd> để lật thẻ và chuyển tiếp</span>
                    </span>
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 shrink-0">
                        <span>Lật xem</span>
                        <i class="fa-solid fa-rotate text-xs"></i>
                    </span>
                </div>
            </div>

            <!-- ================= BACK SIDE (Nghĩa tiếng Việt & Ví dụ ngữ cảnh) ================= -->
            <div v-else class="flex flex-col h-full justify-between space-y-4 rotate-y-180 backface-hidden">
                <!-- Top Toolbar Back -->
                <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                    <div class="flex items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Nghĩa & Giải thích
                        </span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">#{{ index + 1 }}</span>
                    </div>

                    <button
                        v-if="wordTitle"
                        @click.stop="speak(wordTitle)"
                        class="w-9 h-9 rounded-xl text-base text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center shadow-xs border border-indigo-200 dark:border-indigo-800 shrink-0"
                        title="Phát âm tiếng Anh"
                    >
                        <i class="fa-solid fa-volume-high"></i>
                    </button>
                </div>

                <!-- Back Content Body: Vietnamese Meaning & Context Example -->
                <div class="space-y-3.5 flex-1 overflow-y-auto pr-1">
                    <!-- Central Focal Core: Word + IPA + Vietnamese Meaning -->
                    <div class="text-center px-5 py-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/90 dark:border-indigo-400 shadow-sm ring-4 ring-indigo-500/10 w-full">
                        <div class="flex items-center justify-center gap-2">
                            <h3 class="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                                {{ wordTitle }}
                            </h3>
                            <span v-if="ipa" class="text-xs sm:text-sm font-semibold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
                                /{{ ipa }}/
                            </span>
                        </div>

                        <!-- Vietnamese Meaning (Highlighted) -->
                        <div v-if="meaning" class="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-lg sm:text-xl leading-snug">
                                {{ meaning }}
                            </p>
                        </div>
                    </div>

                    <!-- Supporting Full-Width Context Example -->
                    <div v-if="example" class="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 space-y-1.5 shadow-xs text-xs sm:text-sm">
                        <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            <i class="fa-solid fa-quote-left text-[11px]"></i>
                            <span>Ví dụ ngữ cảnh</span>
                        </div>
                        <p class="italic font-medium text-slate-800 dark:text-slate-200 leading-relaxed pl-1">
                            "{{ example }}"
                        </p>
                        <p v-if="note" class="text-xs text-slate-500 dark:text-slate-400 pl-1 pt-1 border-t border-slate-100 dark:border-slate-800 font-normal">
                            ↳ Dịch: {{ note }}
                        </p>
                    </div>

                    <!-- Detailed Explanation / Tech Answer (if no basic vocab or if tech mode) -->
                    <div v-if="!example && answerText" class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-normal shadow-xs">
                        {{ answerText }}
                    </div>
                </div>

                <!-- Bottom Flip Hint Back -->
                <div class="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                    <span class="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
                        <i class="fa-solid fa-lightbulb text-amber-500 shrink-0"></i>
                        <span>Bấm thẻ hoặc phím <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">Space</kbd> và <kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">←</kbd> <kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">→</kbd> để lật thẻ và chuyển tiếp</span>
                    </span>
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 shrink-0">
                        <span>Lật lại</span>
                        <i class="fa-solid fa-rotate-left text-xs"></i>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { getLevelBadgeClass } from "@/composables/useLearningHelper"

const props = defineProps({
    question: {
        type: Object,
        default: () => ({}),
    },
    index: {
        type: Number,
        default: 0,
    },
})

defineEmits(["bookmark"])

const flipped = ref(false)

const wordTitle = computed(() => {
    return props.question?.title || props.question?.word || props.question?.question || ""
})

const ipa = computed(() => {
    return props.question?.content?.pronunciation || props.question?.pronunciation || ""
})

const meaning = computed(() => {
    return props.question?.content?.meaning || props.question?.meaning || (props.question?.prompt !== wordTitle.value ? props.question?.prompt : "") || ""
})

const example = computed(() => {
    return props.question?.content?.example || props.question?.example || ""
})

const note = computed(() => {
    return props.question?.content?.note || props.question?.note || ""
})

const answerText = computed(() => {
    const q = props.question
    return (
        q?.answer ||
        q?.explanation ||
        q?.content?.quick_answer ||
        q?.content?.detailed_answer ||
        q?.sample_solution?.detailed_answer ||
        ""
    )
})

const speak = (text) => {
    if (!text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    window.speechSynthesis.speak(utterance)
}

const handleKeydown = (event) => {
    const target = event.target
    const tagName = target?.tagName?.toLowerCase()
    if (target?.isContentEditable || ["input", "textarea", "select"].includes(tagName)) return

    if (event.code === "Space" || event.key === " ") {
        event.preventDefault()
        flipped.value = !flipped.value
    }
}

watch(
    () => props.question,
    () => {
        flipped.value = false
    },
)

onMounted(() => {
    document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener("keydown", handleKeydown)
})
</script>
