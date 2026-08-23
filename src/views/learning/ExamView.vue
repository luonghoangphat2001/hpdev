<template>
    <LearningLayout :error="error" @retry="startEnglishExam">
        <section class="max-w-4xl mx-auto space-y-4">
            <!-- Top Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ Thi thử" title="Đóng/mở công cụ">
                    <svg class="learning-tools-chevron w-5 h-5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="learning-tools-content">
                    <div class="learning-tools-content-inner space-y-3 px-1 pb-3 pt-1">
                        <div class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 p-2.5 shadow-sm dark:shadow-md flex items-center justify-between gap-2 overflow-x-auto">
                            <span class="text-xs font-mono font-bold text-gray-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center gap-1.5">
                                <i class="fa-solid fa-file-signature text-indigo-600 dark:text-indigo-400"></i>
                                <span>Đề thi 50 câu ngẫu nhiên</span>
                            </span>
                            <button @click="startEnglishExam" :disabled="examLoading" class="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-sm whitespace-nowrap transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-solid fa-play text-xs"></i>
                                <span>{{ examLoading ? "Đang tạo đề..." : "Tạo đề 50 câu" }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </details>

            <div v-if="examLoading" class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                <span>Đang tạo đề thi 50 câu...</span>
            </div>

            <div v-else-if="englishExam.length" class="space-y-4">
                <article v-for="(question, index) in englishExam" :key="question.id || index" class="studio-card p-5 space-y-3">
                    <p class="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">Câu {{ index + 1 }}. {{ question.question || question.title || question.word }}</p>
                    <div class="grid sm:grid-cols-2 gap-2.5 pt-1">
                        <button v-for="option in question.options || []" :key="option.id || option.text || option" class="answer-button">
                            {{ option.text || option }}
                        </button>
                    </div>
                </article>
            </div>

            <div v-else class="loading-card">Bấm “Tạo đề 50 câu” để bắt đầu làm bài thi thử tiếng Anh.</div>
        </section>
    </LearningLayout>
</template>

<script setup>
import { ref } from "vue"
import LearningLayout from "@/layouts/LearningLayout.vue"
import { buildPracticeExam } from "@/api/learning"

const error = ref("")
const englishExam = ref([])
const examLoading = ref(false)

const startEnglishExam = async () => {
    examLoading.value = true
    error.value = ""
    try {
        const res = await buildPracticeExam({ category: "english", type: "vocabulary", count: 50 })
        englishExam.value = res.questions || []
    } catch (err) {
        error.value = err?.message || "Không thể tạo đề thi."
    } finally {
        examLoading.value = false
    }
}
</script>
