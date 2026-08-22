<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="w-full max-w-lg rounded-3xl bg-gray-800 border border-gray-700 shadow-2xl p-6 overflow-hidden">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                <div class="flex items-center gap-2">
                    <span class="text-xl">✨</span>
                    <h3 class="text-base font-bold text-white">Tạo Bài Học Tự Động Bằng AI</h3>
                </div>
                <button @click="$emit('close')" class="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <form @submit.prevent="generate" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1.5">Chủ đề hoặc Công nghệ</label>
                    <input v-model="topic" type="text" placeholder="vd: React Hooks, Docker Networking, IELTS Speaking Part 2" required class="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-gray-300 mb-1.5">Cấp độ</label>
                        <select v-model="level" class="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none focus:border-indigo-500">
                            <option value="Fresher">Fresher / Beginner</option>
                            <option value="Junior">Junior</option>
                            <option value="Middle">Middle / Intermediate</option>
                            <option value="Senior">Senior / Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-300 mb-1.5">Số lượng câu</label>
                        <select v-model="count" class="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none focus:border-indigo-500">
                            <option :value="3">3 câu</option>
                            <option :value="5">5 câu</option>
                            <option :value="10">10 câu</option>
                        </select>
                    </div>
                </div>

                <div class="pt-3 flex items-center justify-end gap-2">
                    <button type="button" @click="$emit('close')" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition">Hủy</button>
                    <button type="submit" :disabled="loading" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-60">
                        <span v-if="loading" class="animate-spin">🌀</span>
                        <span>{{ loading ? "Đang tạo bằng AI..." : "Tạo ngay ✨" }}</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue"
import { generateLearningAI } from "@/api/learning"

const props = defineProps({
    isOpen: Boolean,
})

const emit = defineEmits(["close", "generated"])

const topic = ref("")
const level = ref("Junior")
const count = ref(5)
const loading = ref(false)

const generate = async () => {
    if (!topic.value.trim() || loading.value) return
    loading.value = true
    try {
        const res = await generateLearningAI({
            topic: topic.value,
            level: level.value,
            count: count.value,
        })
        emit("generated", res)
        emit("close")
    } catch (err) {
        alert(`Lỗi khi tạo AI: ${err.message}`)
    } finally {
        loading.value = false
    }
}
</script>
