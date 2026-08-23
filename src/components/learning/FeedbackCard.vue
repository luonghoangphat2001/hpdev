<template>
    <div v-if="feedback" class="p-5 sm:p-6 bg-indigo-50/80 dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
            <h3 class="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-robot text-base text-indigo-600 dark:text-indigo-400"></i>
                <span>{{ title || "Đánh Giá Của AI" }}</span>
            </h3>
            <span v-if="displayScore" class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {{ displayScore }}
            </span>
        </div>

        <div class="text-sm sm:text-base text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-normal">
            {{ commentText }}
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
    feedback: {
        type: [Object, String],
        default: null,
    },
    title: {
        type: String,
        default: "Đánh Giá AI",
    },
})

const displayScore = computed(() => {
    if (!props.feedback || typeof props.feedback !== "object") return null
    if (props.feedback.overall_band) return `${props.feedback.overall_band}/9.0 Band`
    if (props.feedback.score !== undefined && props.feedback.score !== null) return `${props.feedback.score}đ`
    return null
})

const commentText = computed(() => {
    if (!props.feedback) return ""
    if (typeof props.feedback === "string") return props.feedback
    return props.feedback.examiner_comment || props.feedback.summary || props.feedback.feedback || JSON.stringify(props.feedback, null, 2)
})
</script>
