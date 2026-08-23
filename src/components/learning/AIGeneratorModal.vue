<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
        <div class="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl p-4 sm:p-6">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-indigo-600 dark:text-indigo-400"></i>
                        <span>Tạo Nội Dung Học Tập Bằng AI</span>
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Sinh nội dung, xem trước rồi lưu vào ngân hàng Learning.</p>
                </div>
                <button @click="close" class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300">✕</button>
            </div>
            <form @submit.prevent="generate" class="space-y-4">
                <div class="grid sm:grid-cols-2 gap-3">
                    <label>
                        <span>Loại nội dung</span>
                        <select v-model="selectedType" @change="loadTargets" class="field">
                            <option value="tech_question">Tech Questions</option>
                            <option value="vocabulary">Vocabulary</option>
                            <option value="quiz">Quiz</option>
                            <option value="reading">Reading</option>
                            <option value="writing">Writing</option>
                            <option value="speaking">Speaking</option>
                            <option value="ielts">IELTS</option>
                        </select>
                    </label>
                    <label>
                        <span>Stack / Chủ đề</span>
                        <select v-model="selectedSlug" class="field">
                            <option v-for="target in targets" :key="target.slug" :value="target.slug">{{ target.name }}</option>
                        </select>
                    </label>
                </div>
                <div class="grid sm:grid-cols-2 gap-3">
                    <label>
                        <span>Cấp độ</span>
                        <select v-model="level" class="field">
                            <option value="beginner">Beginner / A1-A2</option>
                            <option value="junior">Junior / B1</option>
                            <option value="intermediate">Intermediate / B2</option>
                            <option value="advanced">Advanced / C1</option>
                        </select>
                    </label>
                    <label>
                        <span>Số lượng</span>
                        <select v-model.number="count" class="field">
                            <option :value="3">3 items</option>
                            <option :value="5">5 items</option>
                            <option :value="10">10 items</option>
                            <option :value="20">20 items</option>
                            <option :value="30">30 items</option>
                        </select>
                    </label>
                </div>
                <label> <span>Yêu cầu thêm cho AI (không bắt buộc)</span><textarea v-model="customPrompt" rows="3" class="field resize-y" placeholder="Ví dụ: ưu tiên tình huống thực tế, không lặp từ đã có..."></textarea></label>
                <button type="submit" :disabled="loading" class="primary-button w-full py-2.5 flex items-center justify-center gap-2">
                    <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>{{ loading ? "Đang sinh nội dung bằng AI..." : "Tạo bài học ngay" }}</span>
                </button>
            </form>

            <section v-if="generatedItems.length" class="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div class="flex items-center justify-between">
                    <h4 class="font-bold text-sm text-gray-900 dark:text-white">Xem trước nội dung</h4>
                    <span class="badge">{{ generatedItems.length }} items</span>
                </div>
                <div class="max-h-72 overflow-y-auto space-y-2">
                    <article v-for="(item, index) in generatedItems" :key="index" class="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between gap-2">
                            <b class="text-xs text-gray-900 dark:text-white">{{ index + 1 }}. {{ item.title }}</b
                            ><span class="text-[10px] text-indigo-700 dark:text-indigo-300 font-mono">{{ item.level || level }}</span>
                        </div>
                        <p class="text-[11px] text-gray-700 dark:text-gray-300 mt-1">{{ item.content?.meaning || item.content?.quick_answer || item.prompt || "" }}</p>
                    </article>
                </div>
                <button @click="saveBatch" :disabled="saving" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>{{ saving ? "Đang lưu..." : `Lưu ${generatedItems.length} items vào Ngân hàng` }}</span>
                </button>
            </section>
            <p v-if="error" class="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { generateLearningAI, getLearningDetail, getLearnings, saveLearningAIBatch } from "@/api/learning"

const props = defineProps({ isOpen: Boolean, type: { type: String, default: "tech_question" } })
const emit = defineEmits(["close", "generated"])
const selectedType = ref(props.type),
    selectedSlug = ref(""),
    targets = ref([]),
    level = ref("junior"),
    count = ref(5),
    customPrompt = ref(""),
    generatedItems = ref([]),
    generatedLearningId = ref(null),
    loading = ref(false),
    saving = ref(false),
    error = ref("")

const loadTargets = async () => {
    error.value = ""
    const category = selectedType.value === "tech_question" ? "tech" : "english"
    const res = await getLearnings(category, selectedType.value === "vocabulary" ? "vocabulary" : "")
    let rows = res.learnings || []
    if (selectedType.value !== "tech_question" && selectedType.value !== "vocabulary") {
        const matching = rows.filter((row) => row.type === selectedType.value)
        if (matching.length) rows = matching
        else {
            const vocab = await getLearnings("english", "vocabulary")
            rows = vocab.learnings || []
        }
    }
    targets.value = rows
    selectedSlug.value = rows[0]?.slug || ""
}

watch(
    () => [props.isOpen, props.type],
    async ([open, type]) => {
        if (!open) return
        selectedType.value = type
        generatedItems.value = []
        customPrompt.value = ""
        await loadTargets()
    },
    { immediate: true },
)

const generate = async () => {
    if (!selectedSlug.value) return
    loading.value = true
    error.value = ""
    try {
        const target = targets.value.find((row) => row.slug === selectedSlug.value)
        const res = await generateLearningAI({ category: selectedType.value === "tech_question" ? "tech" : "english", type: selectedType.value, learning: selectedSlug.value, topic_no: target?.topic_no || undefined, level: level.value, count: count.value, prompt: customPrompt.value })
        generatedItems.value = res.items || []
        generatedLearningId.value = res.learningId || target?.id || null
    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}

const resolveLearningId = async () => {
    if (generatedLearningId.value) return generatedLearningId.value
    const canonical = { reading: "english-reading", writing: "english-writing", speaking: "english-speaking", ielts: "english-ielts" }[selectedType.value] || selectedSlug.value
    const detail = await getLearningDetail(canonical)
    return detail.learning?.id
}

const saveBatch = async () => {
    saving.value = true
    error.value = ""
    try {
        const learningId = await resolveLearningId()
        if (!learningId) throw new Error("Không tìm thấy Topic/Stack để lưu.")
        const res = await saveLearningAIBatch({ learning_id: learningId, type: selectedType.value, items: generatedItems.value })
        window.alert(`Đã lưu thành công ${res.count || generatedItems.value.length} items vào Ngân hàng!`)
        emit("generated")
        close()
    } catch (err) {
        error.value = err.message
    } finally {
        saving.value = false
    }
}

const close = () => {
    generatedItems.value = []
    emit("close")
}
</script>

<style scoped>
label > span {
    @apply block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5;
}
.field {
    @apply w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500;
}
.badge {
    @apply px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-semibold;
}
</style>
