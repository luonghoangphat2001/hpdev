<template>
    <LearningLayout :error="error" @retry="loadVocab">
        <section class="space-y-4">
            <!-- Collapsible Top Filter Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-300 hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ học Từ vựng" title="Đóng/mở công cụ">
                    <svg class="learning-tools-chevron w-5 h-5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="learning-tools-content">
                    <div class="learning-tools-content-inner space-y-3 px-1 pb-3 pt-1">
                        <div class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 p-2.5 shadow-sm dark:shadow-md flex items-center gap-2 overflow-x-auto">
                            <!-- Topic Select -->
                            <select v-model="vocabTopicNo" @change="loadVocab" class="h-10 px-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 font-semibold focus:outline-none focus:border-indigo-400 shrink-0">
                                <option v-for="t in vocabTopics" :key="t.id" :value="t.topic_no">{{ t.name }} (Topic {{ t.topic_no }})</option>
                            </select>

                            <!-- Search Input -->
                            <div class="relative flex-1 min-w-[200px]">
                                <input v-model="vocabSearch" @input="debouncedVocabLoad" placeholder="Tìm từ vựng, nghĩa, ví dụ..." class="h-10 w-full pl-8 pr-7 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                                <button v-if="vocabSearch" @click="clearVocabSearch" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                            </div>

                            <!-- Mode Switcher -->
                            <div class="h-10 flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-300 dark:border-gray-700 shrink-0">
                                <button v-for="mode in vocabModes" :key="mode.key" @click="vocabMode = mode.key" class="h-8 px-3 rounded-lg text-xs font-semibold transition flex items-center gap-1.5" :class="vocabMode === mode.key ? 'bg-indigo-600 text-white font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'">
                                    <i :class="mode.icon" class="text-xs"></i>
                                    <span>{{ mode.label }}</span>
                                </button>
                            </div>

                            <!-- Action Buttons -->
                            <button @click="vocabCrudOpen = true" class="h-10 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-solid fa-plus text-xs"></i>
                                <span>Thêm từ</span>
                            </button>
                            <button @click="openGenerator" class="h-10 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
                                <span class="hidden sm:inline">AI Tạo Đề</span>
                            </button>

                            <a :href="vocabExportUrl" target="_blank" class="h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-solid fa-file-excel text-xs"></i>
                                <span>Excel</span>
                            </a>
                        </div>
                    </div>
                </div>
            </details>

            <!-- Loading State -->
            <div v-if="loading" class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                <span>Đang tải danh sách từ vựng...</span>
            </div>

            <!-- Flashcard 3D Mode -->
            <div v-else-if="vocabMode === 'flashcard'" class="max-w-2xl mx-auto space-y-4">
                <Flashcard3D v-if="activeFlashcardWord" :question="activeFlashcardWord" :index="flashcardIndex" />
                <div class="flex justify-center items-center gap-4 bg-gray-800/80 p-3 rounded-2xl border border-gray-700/80 shadow-lg">
                    <button class="nav-button px-4 py-2 flex items-center gap-1" :disabled="flashcardIndex <= 0" @click="moveFlashcard(-1)">
                        <i class="fa-solid fa-arrow-left text-xs"></i>
                        <span>Trước</span>
                    </button>
                    <span class="text-xs font-mono font-bold text-indigo-300 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700"> {{ flashcardIndex + 1 }} / {{ vocabWords.length }} </span>
                    <button class="nav-button px-4 py-2 flex items-center gap-1" :disabled="flashcardIndex >= vocabWords.length - 1" @click="moveFlashcard(1)">
                        <span>Sau</span>
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                </div>
            </div>

            <!-- Mindmap Studio 360 Mode -->
            <div v-else-if="vocabMode === 'mindmap'" class="max-w-3xl mx-auto space-y-4">
                <div v-if="activeFlashcardWord" class="studio-card p-6 sm:p-8 space-y-4 relative overflow-hidden bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <!-- Central focal hub: English word + IPA + Vietnamese meaning -->
                    <div class="mx-auto text-center px-6 py-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/90 dark:border-indigo-400 shadow-sm ring-4 ring-indigo-500/15 w-full">
                        <div class="flex items-center justify-center gap-3">
                            <h2 class="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">{{ activeFlashcardWord.title }}</h2>
                            <button @click="speakWord(activeFlashcardWord.title)" class="w-10 h-10 rounded-2xl text-base text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0" title="Phát âm tiếng Anh">
                                <i class="fa-solid fa-volume-high"></i>
                            </button>
                        </div>
                        <div v-if="activeFlashcardWord.content?.pronunciation" class="mt-2">
                            <span class="text-sm sm:text-base font-semibold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-4 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60 inline-block">
                                /{{ activeFlashcardWord.content.pronunciation }}/
                            </span>
                        </div>

                        <!-- Vietnamese meaning in central focal core -->
                        <div v-if="activeFlashcardWord.content?.meaning || activeFlashcardWord.prompt" class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <p class="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 leading-snug">
                                {{ activeFlashcardWord.content?.meaning || activeFlashcardWord.prompt }}
                            </p>
                        </div>
                    </div>

                    <!-- Supporting full-width context example -->
                    <div v-if="activeFlashcardWord.content?.example" class="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 space-y-2 shadow-xs text-sm sm:text-base">
                        <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            <i class="fa-solid fa-quote-left text-xs"></i>
                            <span>Ví dụ ngữ cảnh</span>
                        </div>
                        <p class="text-sm sm:text-base italic font-medium text-slate-900 dark:text-slate-100 pl-1 leading-relaxed">
                            "{{ activeFlashcardWord.content.example }}"
                        </p>

                        <!-- Vietnamese translation of example -->
                        <div v-if="activeFlashcardWord.content?.note" class="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-1 font-normal">
                            <span class="text-indigo-600 dark:text-indigo-400 font-semibold mr-1">↳ Dịch:</span>
                            <span>{{ activeFlashcardWord.content.note }}</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation controls -->
                <div class="flex justify-center items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
                    <button class="nav-button px-4 py-2 flex items-center gap-1.5" :disabled="flashcardIndex <= 0" @click="moveFlashcard(-1)">
                        <i class="fa-solid fa-arrow-left text-xs"></i>
                        <span>Từ trước</span>
                    </button>
                    <span class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800"> {{ flashcardIndex + 1 }} / {{ vocabWords.length }} </span>
                    <button class="nav-button px-4 py-2 flex items-center gap-1.5" :disabled="flashcardIndex >= vocabWords.length - 1" @click="moveFlashcard(1)">
                        <span>Từ sau</span>
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                </div>
            </div>

            <!-- Vocab Cards Grid Mode -->
            <div v-else class="space-y-4">
                <!-- Header Info Bar -->
                <div class="flex items-center justify-between px-1 text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-gray-900 dark:text-white">{{ activeVocabTopicName }}</span>
                        <span class="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200 dark:border-indigo-800/60"> {{ vocabWords.length }} từ vựng </span>
                    </div>
                </div>

                <!-- Word Cards Grid with Mindmap Layout -->
                <div v-if="vocabWords.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <VocabMindmapCard v-for="word in vocabWords" :key="word.id" :word="word" @speak="speakWord" @send-discord="sendVocabDiscord" @remove="removeVocab" />
                </div>

                <div v-else class="loading-card flex items-center justify-center gap-2">
                    <i class="fa-solid fa-box-open text-gray-400"></i>
                    <span>Chưa có từ vựng nào trong chủ đề này.</span>
                </div>
            </div>

            <!-- Add Vocab Modal -->
            <div v-if="vocabCrudOpen" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <form @submit.prevent="createVocab" class="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-indigo-600 dark:text-indigo-400"></i>
                            <h3 class="font-bold text-gray-900 dark:text-white text-base">Thêm từ mới vào {{ activeVocabTopicName }}</h3>
                        </div>
                        <button type="button" @click="vocabCrudOpen = false" class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">✕</button>
                    </div>
                    <div class="grid sm:grid-cols-2 gap-3">
                        <label>
                            <span class="crud-label">Từ vựng (English)</span>
                            <input v-model.trim="newVocab.title" required class="input-control" placeholder="e.g. Resilience" />
                        </label>
                        <label>
                            <span class="crud-label">Phiên âm IPA</span>
                            <input v-model.trim="newVocab.pronunciation" class="input-control" placeholder="e.g. rɪˈzɪliəns" />
                        </label>
                    </div>
                    <label>
                        <span class="crud-label">Nghĩa tiếng Việt</span>
                        <input v-model.trim="newVocab.meaning" class="input-control" placeholder="e.g. Khả năng phục hồi, kiên cường" />
                    </label>
                    <label>
                        <span class="crud-label">Câu ví dụ thực tế</span>
                        <textarea v-model.trim="newVocab.example" rows="3" class="input-control" placeholder="Ví dụ câu chứa từ vựng..."></textarea>
                    </label>
                    <label>
                        <span class="crud-label">Ghi chú / Collocation</span>
                        <input v-model.trim="newVocab.note" class="input-control" placeholder="Ghi chú thêm..." />
                    </label>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" @click="vocabCrudOpen = false" class="secondary-button">Hủy</button>
                        <button class="primary-button font-bold">Lưu từ vựng</button>
                    </div>
                </form>
            </div>

            <!-- AI Generator Modal -->
            <AIGeneratorModal :is-open="aiGeneratorOpen" type="vocabulary" @close="aiGeneratorOpen = false" @generated="loadVocab" />
        </section>
    </LearningLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import LearningLayout from "@/layouts/LearningLayout.vue"
import Flashcard3D from "@/components/learning/Flashcard3D.vue"
import VocabMindmapCard from "@/components/learning/VocabMindmapCard.vue"
import AIGeneratorModal from "@/components/learning/AIGeneratorModal.vue"
import { getLearnings, getLearningItems, saveLearningItem, deleteLearningItem, sendLearningDiscord, learningExportUrl } from "@/api/learning"
import { normalizeLearningItems } from "@/composables/useLearningHelper"

const loading = ref(false)
const error = ref("")
const vocabTopics = ref([])
const vocabWords = ref([])
const vocabTopicNo = ref(1)
const vocabSearch = ref("")
const aiGeneratorOpen = ref(false)
const vocabCrudOpen = ref(false)
const newVocab = ref({ title: "", pronunciation: "", meaning: "", example: "", note: "" })

const vocabModes = [
    { key: "grid", icon: "fa-solid fa-list-ul", label: "Danh sách từ" },
    { key: "mindmap", icon: "fa-solid fa-brain", label: "Mindmap 360°" },
    { key: "flashcard", icon: "fa-solid fa-layer-group", label: "Flashcard 3D" },
]
const vocabMode = ref("grid")
const flashcardIndex = ref(0)

const activeVocabTopic = computed(() => vocabTopics.value.find((topic) => Number(topic.topic_no) === vocabTopicNo.value))
const activeVocabTopicName = computed(() => activeVocabTopic.value?.name || `Topic ${vocabTopicNo.value}`)
const vocabExportUrl = computed(() => learningExportUrl(`vocab-topic-${vocabTopicNo.value}`))

const activeFlashcardWord = computed(() => {
    const word = vocabWords.value[flashcardIndex.value]
    if (!word) return null
    return {
        ...word,
        word: word.title,
        meaning: word.content?.meaning || word.prompt,
        pronunciation: word.content?.pronunciation,
        example: word.content?.example,
        note: word.content?.note,
        answer: word.content?.meaning || word.prompt,
    }
})

let vocabTimer = null
const debouncedVocabLoad = () => {
    clearTimeout(vocabTimer)
    vocabTimer = setTimeout(loadVocab, 250)
}

const clearVocabSearch = () => {
    vocabSearch.value = ""
    loadVocab()
}

const openGenerator = () => {
    aiGeneratorOpen.value = true
}

const moveFlashcard = (offset) => {
    flashcardIndex.value = Math.max(0, Math.min(vocabWords.value.length - 1, flashcardIndex.value + offset))
}

const speakWord = (text) => {
    if (!text || !window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    window.speechSynthesis.speak(utterance)
}

const loadVocab = async () => {
    loading.value = true
    error.value = ""
    try {
        if (!vocabTopics.value.length) {
            const topics = await getLearnings("english", "vocabulary")
            vocabTopics.value = topics.learnings || []
            if (vocabTopics.value.length && !vocabTopicNo.value) {
                vocabTopicNo.value = Number(vocabTopics.value[0].topic_no)
            }
        }
        const res = await getLearningItems({
            category: "english",
            type: "vocabulary",
            topic_no: vocabTopicNo.value,
            search: vocabSearch.value,
            limit: 100,
        })
        vocabWords.value = normalizeLearningItems(res.items)
        flashcardIndex.value = 0
    } catch (err) {
        error.value = err?.message || "Không thể tải danh sách từ vựng."
    } finally {
        loading.value = false
    }
}

const createVocab = async () => {
    if (!activeVocabTopic.value) return
    try {
        await saveLearningItem({
            learning_id: activeVocabTopic.value.id,
            type: "vocabulary",
            title: newVocab.value.title,
            prompt: newVocab.value.example,
            content: {
                pronunciation: newVocab.value.pronunciation,
                meaning: newVocab.value.meaning,
                example: newVocab.value.example,
                note: newVocab.value.note,
            },
        })
        newVocab.value = { title: "", pronunciation: "", meaning: "", example: "", note: "" }
        vocabCrudOpen.value = false
        await loadVocab()
    } catch (err) {
        error.value = err?.message || "Không thể lưu từ vựng mới."
    }
}

const sendVocabDiscord = async (word) => {
    if (!window.confirm(`Gửi từ vựng "${word.title}" vào kênh Discord?`)) return
    try {
        await sendLearningDiscord(word.id)
        window.alert("Đã gửi từ vựng vào Discord thành công!")
    } catch (err) {
        error.value = err?.message || "Không thể gửi tin nhắn Discord."
    }
}

const removeVocab = async (word) => {
    if (!window.confirm(`Xóa từ "${word.title}"?`)) return
    try {
        await deleteLearningItem(word.id)
        await loadVocab()
    } catch (err) {
        error.value = err?.message || "Không thể xóa từ vựng."
    }
}

const handleKeydown = (event) => {
    const target = event.target
    const tagName = target?.tagName?.toLowerCase()
    if (target?.isContentEditable || ["input", "textarea", "select"].includes(tagName)) return

    if (vocabMode.value === "flashcard") {
        if (event.key === "ArrowLeft") {
            event.preventDefault()
            moveFlashcard(-1)
        } else if (event.key === "ArrowRight") {
            event.preventDefault()
            moveFlashcard(1)
        }
    }
}

onMounted(() => {
    loadVocab()
    document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
    clearTimeout(vocabTimer)
    document.removeEventListener("keydown", handleKeydown)
})
</script>
